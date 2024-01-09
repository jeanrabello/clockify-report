import { Router } from 'express';
import GetClockifyUserController from './controllers/GetClockifyUserController';

const router = Router();

const getClockifyUserController = new GetClockifyUserController();

router.post('/', getClockifyUserController.generateReport);

export default router;
