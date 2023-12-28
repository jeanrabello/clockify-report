import { Request, Response, Router } from 'express';
import GetTimeEntriesController from './controllers/GetTimeEntriesController';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
	return res.send('salve');
});

router.get('/timeEntries/month', async (req: Request, res: Response) => {
	const controller = new GetTimeEntriesController();
	const result = await controller.handle(req, res);
	return res.send(result);
});

export default router;
