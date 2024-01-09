import { Request, Response } from 'express';
import Controller from '../global/Controller';
import { CLOCKIFY_USER, CUSTOM_ERROR, TIME_ENTRY } from '../global/types';
import { ClockifyTimeEntryQueryFilterModel } from '../models/ClockifyTimeEntryQueryFilterModel';
import GenerateClockifyReportFactory from '../factories/GenerateClockifyReportFactory';

export default class GetClockifyUserController extends Controller {
	constructor() {
		super();
		this.generateReport = this.generateReport.bind(this);
	}

	async generateReport(req: Request, res: Response) {
		try {
			const { xApiKey, start, end } = req.query;

			const timeEntry: TIME_ENTRY = {
				filter: {
					start,
					end,
				},
			} as TIME_ENTRY;

			const domain = new ClockifyTimeEntryQueryFilterModel(
				xApiKey as string,
				{} as CLOCKIFY_USER,
				timeEntry
			);

			const factory = new GenerateClockifyReportFactory(domain);
			const result = await factory.execute();
			res.download(result as string);
		} catch (error) {
			this.generateError(res, error as CUSTOM_ERROR);
		}
	}
}
