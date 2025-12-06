import App from './app';

const app = new App();
const port = parseInt(process.env.PORT || '3000');

app.start(port);