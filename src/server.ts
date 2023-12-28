import express from 'express';
import routes from './routes';
import * as dotenv from 'dotenv';

dotenv.config();
const app = express();

const PORT = Number(process.env.PORT) || 3000;

const start = () => {
	app.use(routes);

	try {
		app.listen(PORT, () => console.log(`Running at ${PORT}`));
	} catch (error) {
		process.exit(1);
	}
};

start();
