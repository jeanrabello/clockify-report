import moment from 'moment';
import { IStrategy } from '../global/interfaces';
import {
	CLOCKIFY_TIME_ENTRY_QUERY_FILTER,
	CLOCKIFY_WORKSPACE_PROJECT,
	COMUNIX_XLSX_ROW,
	TIME_ENTRY,
} from '../global/types';
import axios from 'axios';

export default class GenerateTimeEntriesRowsStrategy implements IStrategy {
	async execute(
		domain: CLOCKIFY_TIME_ENTRY_QUERY_FILTER,
		dto: TIME_ENTRY[]
	): Promise<any> {
		const consolidatedData: any = [];
		const workspacesId = [
			...new Set(dto.map((te: TIME_ENTRY) => te.workspaceId)),
		];

		const userWorkspacesProjects = await this.getWorkspacesProjects(
			workspacesId,
			domain.xApiKey
		);

		for (let i = 0; i < dto.length; i++) {
			const timeEntry = dto[i];

			const currentRowDateStart = moment(timeEntry.timeInterval.start);
			const previousRowDateStart =
				i >= 1 ? moment(dto[i - 1].timeInterval.start) : currentRowDateStart;

			let timeEntryProject = userWorkspacesProjects.find(
				(project: CLOCKIFY_WORKSPACE_PROJECT) =>
					project.id === timeEntry.projectId
			);

			let projectName = timeEntryProject ? timeEntryProject.name : '';

			const splittedDescription = timeEntry.description.split('/');

			const getTreatedTime = () => {
				const { start, end } = timeEntry.timeInterval;
				const dataInicio = moment(start);
				const dataFim = moment(end);
				const diferencaTempo = moment.duration(dataFim.diff(dataInicio));
				return diferencaTempo.asMinutes(); // Retorna a diferença em minutos
			};

			const currentRowDay = currentRowDateStart.format('YYYY-MM-DD');
			const previousRowDay = previousRowDateStart.format('YYYY-MM-DD');

			const row = [
				splittedDescription[1],
				splittedDescription[2],
				splittedDescription[0],
				projectName,
				getTreatedTime(),
				currentRowDay,
			];

			if (currentRowDay !== previousRowDay) {
				consolidatedData.push([]);
			}

			const duplicatedRow = consolidatedData.findIndex(
				(timeEntry: COMUNIX_XLSX_ROW) =>
					timeEntry[0] === row[0] &&
					timeEntry[1] === row[1] &&
					timeEntry[2] === row[2] &&
					timeEntry[3] === row[3] &&
					currentRowDay === timeEntry[5]
			);

			if (duplicatedRow >= 0) {
				consolidatedData[duplicatedRow][4] += row[4];
			} else {
				consolidatedData.push(row);
			}
		}

		for (const timeEntry of consolidatedData) {
			if (!timeEntry[4]) continue;
			timeEntry[4] = this.formatDuration(timeEntry[4]);
		}

		return consolidatedData;
	}

	formatDuration(minutes: number): string {
		const duration = moment.duration(minutes, 'minutes');
		const hours = Math.floor(duration.asHours()).toString().padStart(2, '0');
		const minutesFormatted = duration.minutes().toString().padStart(2, '0');
		const secondsFormatted = duration.seconds().toString().padStart(2, '0');
		return `${hours}:${minutesFormatted}:${secondsFormatted}`;
	}

	async getWorkspacesProjects(
		workspacesId: string[],
		xApiKey: string
	): Promise<CLOCKIFY_WORKSPACE_PROJECT[]> {
		let projects = [] as CLOCKIFY_WORKSPACE_PROJECT[];

		for (let i = 0; i < workspacesId.length; i++) {
			const workspaceId = workspacesId[i];

			let workspaceProjects = (await axios
				.get(
					`${process.env.CLOCKIFY_API_BASE_URL}/workspaces/${workspaceId}/projects`,
					{
						headers: {
							'x-api-key': xApiKey,
							'Content-Type': 'application/json',
						},
					}
				)
				.then((res) => res.data)) as CLOCKIFY_WORKSPACE_PROJECT[];

			for (const project of workspaceProjects) {
				projects.push(project);
			}
		}

		return projects;
	}
}
