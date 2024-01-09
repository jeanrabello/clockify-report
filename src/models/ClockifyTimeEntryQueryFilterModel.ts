import { CLOCKIFY_USER, TIME_ENTRY } from '../global/types';

export class ClockifyTimeEntryQueryFilterModel {
	constructor(
		public xApiKey: string = '',
		public user: CLOCKIFY_USER,
		public timeEntry: TIME_ENTRY
	) {}
}
