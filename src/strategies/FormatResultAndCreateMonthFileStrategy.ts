import moment from 'moment';
import { IStrategy } from '../global/interfaces';
import {
	CLOCKIFY_TIME_ENTRY_QUERY_FILTER,
	CLOCKIFY_USER,
	COMUNIX_XLSX_ROW,
	TIME_ENTRY_FILTER,
} from '../global/types';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

export default class FormatResultAndCreateMonthFileStrategy
	implements IStrategy
{
	async execute(
		domain: CLOCKIFY_TIME_ENTRY_QUERY_FILTER,
		dto: COMUNIX_XLSX_ROW[]
	): Promise<string> {
		const result = await this.generateXLSX(
			domain.user,
			dto,
			domain.timeEntry.filter
		);
		// await this.sendReportToEmail(result, domain.user.email);
		return result;
	}

	async generateXLSX(
		user: CLOCKIFY_USER,
		rows: COMUNIX_XLSX_ROW[],
		filter: TIME_ENTRY_FILTER
	): Promise<string> {
		// Timestamp
		const timestamp = new Date().getTime();

		// Create Sheet
		const ws = XLSX.utils.aoa_to_sheet(rows);

		// Create Workbook
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'REPORT');

		// Create file output path
		const outputPath = path.join(
			'src',
			'timeReports',
			`${user.id}-${user.name}.xlsx`
		);

		// Get or create directory to create the output file
		const directory = path.dirname(outputPath);

		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
		}

		// Create file
		XLSX.writeFile(wb, outputPath);

		console.log(
			`Relatório do período ${filter.start} - ${filter.end} criado com sucesso.`
		);
		return outputPath;
	}

	async sendReportToEmail(outputPath: string, userEmail: string) {
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
			to: `${userEmail}`,
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
			}
		});

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.error('Erro ao enviar o e-mail:', error);
			}
		});
	}
}
