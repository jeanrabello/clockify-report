export default class CustomError extends Error {
	public status: number = 500;

	constructor(message: string, status: number) {
		super(message || 'Error not specified.');
		this.status = status;
	}
}
