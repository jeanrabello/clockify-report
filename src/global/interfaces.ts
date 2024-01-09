import { CUSTOM_ERROR, EXECUTE_RESULT } from './types';

export interface IFactory {
	execute(): Promise<EXECUTE_RESULT | void>;
}

export interface IStrategy {
	execute(domain: any, dto: EXECUTE_RESULT): Promise<any>;
}

export interface IController {
	handleError(res: Request, error: CUSTOM_ERROR): any;
}
