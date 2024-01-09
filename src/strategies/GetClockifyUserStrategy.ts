import axios from 'axios';
import { IStrategy } from '../global/interfaces';
import {
	CLOCKIFY_TIME_ENTRY_QUERY_FILTER,
	CLOCKIFY_USER,
} from '../global/types';
import CustomError from '../global/classes/CustomError';

export default class GetClockifyUserStrategy implements IStrategy {
	async execute(
		domain: CLOCKIFY_TIME_ENTRY_QUERY_FILTER
	): Promise<CLOCKIFY_USER> {
		const clockifyUser: CLOCKIFY_USER = await axios
			.get('https://api.clockify.me/api/v1/user', {
				headers: {
					'x-api-key': domain.xApiKey,
					'Content-Type': 'application/json',
				},
			})
			.then((res) => res.data);

		if (!clockifyUser) {
			throw new CustomError(
				'Não foi possível recuperar os dados de usuário CLOCKIFY',
				500
			);
		}

		domain.user = clockifyUser;
		return clockifyUser;
	}
}
