import axios from 'axios';
import { IStrategy } from '../global/interfaces';
import { CLOCKIFY_USER, CLOCKIFY_WORKSPACE } from '../global/types';
import CustomError from '../global/classes/CustomError';

export default class GetClockifyUserWorkspacesStrategy implements IStrategy {
	constructor() {}

	async execute(domain: any, dto: CLOCKIFY_USER): Promise<any> {
		const workSpaces: CLOCKIFY_WORKSPACE[] = await axios
			.get('https://api.clockify.me/api/v1/workspaces', {
				headers: {
					'x-api-key': domain.xApiKey,
					'Content-Type': 'application/json',
				},
			})
			.then((res) => {
				return res.data;
			});

		if (!workSpaces.length) {
			throw new CustomError(
				'Não foi possível recuperar um workspace do projeto.',
				500
			);
		}

		dto.workspaces = workSpaces.filter(
			(w: CLOCKIFY_WORKSPACE) =>
				w.name.toUpperCase() === 'COMUNIX' ||
				w.name === `${dto.name}'s workspace`
		);

		if (dto.workspaces.length < 1) {
			throw new CustomError('Workspace "COMUNIX" não encontrado.', 502);
		}
		return dto;
	}
}
