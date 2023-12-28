export type TIME_ENTRY = {
	description: string;
	timeInterval: {
		start: string;
		end: string;
		duration: string;
	};
	projectId: string;
	filter: TIME_ENTRY_FILTER;
};

export type TIME_ENTRY_FILTER = {
	start: string;
	end: string;
};

export type TIME_INTERVAL = {
	start: string;
	end: string;
};
