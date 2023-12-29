import { Request, Response } from 'express';
import GetMonthTimeEntriesService from '../services/GetMonthTimeEntriesService';
import moment from 'moment';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { TIME_ENTRY_FILTER, TIME_INTERVAL } from '../global/types';
import ClockifyParamsModel from '../models/ClockifyParamsModel';
import { google } from 'googleapis';

type TIME_ENTRY = {
	description: string;
	timeInterval: {
		start: string;
		end: string;
		duration: string;
	};
	projectId: string;
	filter: TIME_ENTRY_FILTER;
};

export default class GetTimeEntriesController {
	async handle(req: Request, res: Response) {
		const timeEntriesService = new GetMonthTimeEntriesService();
		const now = moment();

		const monthFilter = {
			start: now.startOf('month').format('YYYY-MM-DD'),
			end: now.endOf('month').format('YYYY-MM-DD'),
		};

		const queryParams: TIME_ENTRY = req.query as TIME_ENTRY;

		const model = new ClockifyParamsModel({
			...queryParams,
			filter: monthFilter,
		});

		const timeEntries = await timeEntriesService.execute(
			model.timeEntry.filter
		);

		const result = await this.generateXLSX(timeEntries);
		await this.sendReportToEmail(result);
		return { message: 'Relatório enviado com sucesso.' };
	}

	getProjectName(projectId: string) {
		switch (projectId) {
			case process.env.CLOCKIFY_PROJECT_MURALIS_ID:
				return 'MURALIS';
			case process.env.CLOCKIFY_PROJECT_COMUNIX_ID:
				return 'COMUNIX';
			default:
				return 'COMUNIX';
		}
	}

	formatDuration(minutes: number): string {
		const duration = moment.duration(minutes, 'minutes');
		const hours = Math.floor(duration.asHours()).toString().padStart(2, '0');
		const minutesFormatted = duration.minutes().toString().padStart(2, '0');
		const secondsFormatted = duration.seconds().toString().padStart(2, '0');
		return `${hours}:${minutesFormatted}:${secondsFormatted}`;
	}

	generateXLSXRows(timeEntries: TIME_ENTRY[]): any {
		const consolidatedData = [];

		for (let i = 0; i < timeEntries.length; i++) {
			const timeEntry = timeEntries[i];

			const dataInicio = moment(timeEntry.timeInterval.start);
			const projectName = this.getProjectName(timeEntry.projectId);
			const splittedDescription = timeEntry.description.split('/');

			const getTreatedTime = () => {
				const { start, end } = timeEntry.timeInterval;
				const dataInicio = moment(start);
				const dataFim = moment(end);
				const diferencaTempo = moment.duration(dataFim.diff(dataInicio));
				return diferencaTempo.asMinutes(); // Retorna a diferença em minutos
			};

			const row = [
				splittedDescription[1],
				splittedDescription[2],
				splittedDescription[0],
				projectName,
				getTreatedTime(),
			];

			const currentDay = dataInicio.format('YYYY-MM-DD');

			// Encontrar a última entrada no mesmo dia com a mesma descrição
			const lastEntryIndex = consolidatedData
				.slice()
				.reverse()
				.findIndex(
					(entry) =>
						entry[0] === row[0] &&
						entry[2] === row[2] &&
						entry[3] === row[3] &&
						typeof entry[4] === 'number'
				);

			if (lastEntryIndex !== -1) {
				// Somar o tempo ao último registro encontrado
				const duration =
					consolidatedData[consolidatedData.length - 1 - lastEntryIndex][4];
				consolidatedData[consolidatedData.length - 1 - lastEntryIndex][4] =
					typeof duration === 'number'
						? duration + Number(row[4])
						: Number(row[4]);
			} else {
				// Adiciona uma linha em branco se o dia for diferente do anterior
				if (
					i > 0 &&
					currentDay !==
						moment(timeEntries[i - 1].timeInterval.start).format('YYYY-MM-DD')
				) {
					consolidatedData.push([]); // Adiciona uma linha em branco
				}

				consolidatedData.push(row); // Adiciona a linha atual
			}
		}

		// Converte a duração total de minutos para o formato hh:mm:ss
		consolidatedData.forEach((entry) => {
			entry[4] =
				typeof entry[4] === 'number' ? this.formatDuration(entry[4]) : entry[4];
		});

		return consolidatedData;
	}

	async generateXLSX(data: TIME_ENTRY[]): Promise<String> {
		const rows = await this.generateXLSXRows(data);

		//Actual Month
		moment.locale('pt-br');
		const monthName = moment().format('MMMM');
		const formattedMonthName =
			monthName.charAt(0).toUpperCase() + monthName.slice(1);
		const actualYear = moment().year();

		// Create Sheet
		const ws = XLSX.utils.aoa_to_sheet(rows);

		// Create Workbook
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'REPORT');

		// Create file output path
		const outputPath = path.join(
			'src',
			'timeReports',
			`${formattedMonthName}_${actualYear}.xlsx`
		);

		// Get or create directory to create the output file
		const directory = path.dirname(outputPath);

		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
		}

		// Create file
		XLSX.writeFile(wb, outputPath);

		console.log(
			`Relatório do mês de ${formattedMonthName} de ${actualYear} criado com sucesso.`
		);
		return outputPath;
	}

	async sendReportToEmail(outputPath: any) {
		const monthName = moment().format('MMMM');
		const formattedMonthName =
			monthName.charAt(0).toUpperCase() + monthName.slice(1);
		const actualYear = moment().year();

		const oauth2Client = new google.auth.OAuth2(
			process.env.NODEMAILER_CLIENT_ID,
			process.env.NODEMAILER_CLIENT_SECRET,
			'https://developers.google.com/oauthplayground/'
		);

		oauth2Client.setCredentials({
			refresh_token: process.env.NODEMAILER_REFRESH_TOKEN,
		});

		const accessToken = await oauth2Client.getAccessToken();

		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,
			secure: false,
			auth: {
				type: 'OAuth2',
				user: process.env.NODEMAILER_USER,
				clientId: process.env.NODEMAILER_CLIENT_ID,
				clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
				refreshToken: process.env.NODEMAILER_REFRESH_TOKEN,
				accessToken: accessToken,
			} as any,
		});

		const mailOptions = {
			from: `TIME REPORT <${process.env.NODEMAILER_USER}>`,
			to: `${process.env.NODEMAILER_USER}`,
			subject: `TIME REPORT -> ${formattedMonthName} - ${actualYear}`,
			attachments: [
				{
					filename: 'report.xlsx',
					content: fs.createReadStream(outputPath),
				},
			],
		};

		transporter.verify(function (error, success) {
			if (error) {
				console.log(
					'Erro ao verificar a conexão com o servidor de e-mail:',
					error
				);
				throw new Error(error.message);
			} else {
				console.log('Conexão com o servidor de e-mail bem-sucedida:', success);
			}
		});

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.error('Erro ao enviar o e-mail:', error);
			}
		});
	}
}
