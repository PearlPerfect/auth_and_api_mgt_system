import App from './app';
import dotenv from 'dotenv';

dotenv.config();
const app = new App();
const port = parseInt(process.env.PORT || '3000');

app.start(port);