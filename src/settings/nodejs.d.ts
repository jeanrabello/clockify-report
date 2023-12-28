declare namespace NodeJS {
	interface ProcessEnv {
		readonly CLOCKIFY_API_BASE_URL: string;
		readonly CLOCKIFY_API_KEY: string;
		readonly CLOCKIFY_USER_ID: string;
		readonly CLOCKIFY_WORKSPACE_ID: string;
		readonly CLOCKIFY_PROJECT_MURALIS_ID: string;
		readonly CLOCKIFY_PROJECT_COMUNIX_ID: string;
		readonly NODEMAILER_USER: string;
		readonly NODEMAILER_PASS: string;
		readonly NODEMAILER_REFRESH_TOKEN: string;
		readonly NODEMAILER_CLIENT_ID: string;
		readonly NODEMAILER_CLIENT_SECRET: string;
	}
}
