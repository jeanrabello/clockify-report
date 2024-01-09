import { CUSTOM_ERROR } from './types';
import { Response } from 'express';

export default class Controller {
	constructor() {
		this.generateError = this.generateError.bind(this);
	}

	generateError(res: Response, error: CUSTOM_ERROR) {
		const { status, message, stack } = error;
		res.status(status ? status : 500).json(message);
		// console.log(stack);
	}
}
