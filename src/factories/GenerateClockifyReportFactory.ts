import { IFactory, IStrategy } from '../global/interfaces';
import { EXECUTE_RESULT } from '../global/types';
import { ClockifyTimeEntryQueryFilterModel } from '../models/ClockifyTimeEntryQueryFilterModel';
import FormatResultAndCreateMonthFileStrategy from '../strategies/FormatResultAndCreateMonthFileStrategy';
import GenerateTimeEntriesRowsStrategy from '../strategies/GenerateTimeEntriesRowsStrategy';
import GetClockifyUserStrategy from '../strategies/GetClockifyUserStrategy';
import GetClockifyUserWorkspacesStrategy from '../strategies/GetClockifyUserWorkspacesStrategy';
import GetTimeEntriesStrategies from '../strategies/GetTimeEntriesStrategies';
import VerifyClockifyXApiKeyStrategy from '../strategies/VerifyClockifyXApiKeyStrategy';

export default class GenerateClockifyReportFactory implements IFactory {
	public domain: ClockifyTimeEntryQueryFilterModel;
	public result: EXECUTE_RESULT = null;

	private strategies: IStrategy[] = [
		new VerifyClockifyXApiKeyStrategy(),
		new GetClockifyUserStrategy(),
		new GetClockifyUserWorkspacesStrategy(),
		new GetTimeEntriesStrategies(),
		new GenerateTimeEntriesRowsStrategy(),
		new FormatResultAndCreateMonthFileStrategy(),
	];

	constructor(domain: ClockifyTimeEntryQueryFilterModel) {
		this.domain = domain;
	}

	async execute(): Promise<EXECUTE_RESULT | void> {
		for (const strategy of this.strategies) {
			this.result = await strategy.execute(this.domain, this.result);
		}

		return this.result;
	}
}
