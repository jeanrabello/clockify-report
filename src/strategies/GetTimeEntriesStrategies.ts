import axios from 'axios';
import { IStrategy } from '../global/interfaces';
import { CLOCKIFY_USER, EXECUTE_RESULT, TIME_ENTRY } from '../global/types';
import { ClockifyTimeEntryQueryFilterModel } from '../models/ClockifyTimeEntryQueryFilterModel';
import CustomError from '../global/classes/CustomError';

export default class GetTimeEntriesStrategies implements IStrategy {
	constructor() {}

	async execute(
		domain: ClockifyTimeEntryQueryFilterModel,
		dto: CLOCKIFY_USER
	): Promise<EXECUTE_RESULT> {
		const { start, end } = domain.timeEntry.filter;
		const basePath = 'https://api.clockify.me/api/v1';

		if (!dto.workspace) {
			throw new CustomError('Workspace "COMUNIX" não encontrado.', 502);
		}

		const fullPath = `${basePath}/workspaces/${dto.workspace.id}/user/${dto.id}/time-entries`;
		const timeEntries: TIME_ENTRY[] = await axios
			.get(fullPath, {
				headers: {
					'x-api-key': domain.xApiKey,
					'Content-Type': 'application/json',
				},
				params: {
					start: `${start}T00:00:00Z`,
					end: `${end}T23:59:59Z`,
					['page-size']: 200,
				},
			})
			.then((res) => res.data);

		return timeEntries;
	}
}
