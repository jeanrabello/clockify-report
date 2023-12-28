import axios, { AxiosRequestConfig } from 'axios';
import { TIME_ENTRY, TIME_ENTRY_FILTER } from '../global/types';

export default class GetMonthTimeEntriesService {
	async execute(filter: TIME_ENTRY_FILTER): Promise<TIME_ENTRY[]> {
		const apiUrl = process.env.CLOCKIFY_API_BASE_URL || null;
		const apiKey = process.env.CLOCKIFY_API_KEY || null;

		if (apiUrl === null) throw new Error('API URL not defined.');
		if (apiKey === null) throw new Error('API KEY not defined.');

		const workspaceId = process.env.CLOCKIFY_WORKSPACE_ID || null;
		const userId = process.env.CLOCKIFY_USER_ID || null;

		if (workspaceId === null || userId === null)
			throw new Error('WORKSPACE_ID or USER_ID not defined.');

		const routePath = `${apiUrl}/workspaces/${workspaceId}/user/${userId}/time-entries`;

		const options: AxiosRequestConfig = {
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.CLOCKIFY_API_KEY,
			},
			params: {
				start: `${filter.start}T00:00:00Z`,
				end: `${filter.end}T23:59:59Z`,
				['page-size']: 200,
			},
		};

		const { data: result } = await axios.get(routePath, options);
		return result;
	}
}
