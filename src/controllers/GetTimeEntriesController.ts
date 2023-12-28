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
		return 'Relatório enviado com sucesso.';
	}

	generateXLSXRows(timeEntries: TIME_ENTRY[]): any {
		const result = [];

		for (let i = 0; i < timeEntries.length; i++) {
			const timeEntry: TIME_ENTRY = timeEntries[i];

			const getTreatedTime = (timeInterval: TIME_INTERVAL) => {
				const { start, end } = timeInterval;

				// Parse das strings de data e hora para objetos Moment
				const dataInicio = moment(start);
				const dataFim = moment(end);

				// Calcular a diferença entre as duas datas
				const diferencaTempo = moment.duration(dataFim.diff(dataInicio));

				// Formatar a diferença de tempo
				const horas = diferencaTempo.hours().toString().padStart(2, '0');
				const minutos = diferencaTempo.minutes().toString().padStart(2, '0');
				const segundos = diferencaTempo.seconds().toString().padStart(2, '0');

				return `${horas}:${minutos}:${segundos}`;
			};

			if (i > 0) {
				let currentTimeEntryDay = timeEntry.timeInterval.start
					.split('-')[2]
					.split('T')[0];

				let previusTimeEntryDay = timeEntries[i - 1].timeInterval.start
					.split('-')[2]
					.split('T')[0];

				if (currentTimeEntryDay !== previusTimeEntryDay) result.push([]);
			}

			let projectName = '';

			switch (timeEntry.projectId) {
				case process.env.CLOCKIFY_PROJECT_MURALIS_ID:
					projectName = 'MURALIS';
					break;

				case process.env.CLOCKIFY_PROJECT_COMUNIX_ID:
					projectName = 'COMUNIX';
					break;

				default:
					projectName = 'COMUNIX';
					break;
			}

			const splittedDescription = timeEntry.description.split('/');

			const row = [
				splittedDescription[1],
				splittedDescription[2],
				splittedDescription[0],
				projectName,
				getTreatedTime(timeEntry.timeInterval),
			];

			result.push(row);
		}

		return result;
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
