export type EXECUTE_RESULT =
	| object
	| object[]
	| string
	| string[]
	| number
	| number[]
	| null;

export type CLOCKIFY_AUTH = {
	xApiKey: string;
};

export type CLOCKIFY_USER = {
	id: string;
	email: string;
	name: string;
	profilePicture: string;
	activeWorkspace: string;
	defaultWorkspace: string;
	workspaces: CLOCKIFY_WORKSPACE[];
	workspace: CLOCKIFY_WORKSPACE;
};

export type CLOCKIFY_WORKSPACE = {
	id: string;
	name: string;
	projects: CLOCKIFY_WORKSPACE_PROJECT[];
};

export type CLOCKIFY_WORKSPACE_PROJECT = {
	id: string;
	name: string;
};

export type TIME_ENTRY = {
	description: string;
	timeInterval: {
		start: string;
		end: string;
		duration: string;
	};
	projectId: string;
	workspaceId: string;
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

export type CUSTOM_ERROR = {
	message: string;
	stack: string;
	status: number;
};

export type COMUNIX_XLSX_ROW = [string, string, string, string, string, string];

export type CLOCKIFY_TIME_ENTRY_QUERY_FILTER = {
	xApiKey: string;
	user: CLOCKIFY_USER;
	timeEntry: TIME_ENTRY;
};
