import CustomError from '../global/classes/CustomError';
import { IStrategy } from '../global/interfaces';
import { CLOCKIFY_AUTH } from '../global/types';

export default class VerifyClockifyXApiKeyStrategy implements IStrategy {
	async execute(domain: CLOCKIFY_AUTH): Promise<void> {
		if (!domain.xApiKey) {
			throw new CustomError('API KEY NOT FOUND.', 500);
		}
	}
}
