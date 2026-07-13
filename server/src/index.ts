import http from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { initSocket } from './socket';

const app = createApp();
const server = http.createServer(app);

initSocket(server);

server.listen(env.port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${env.port}`);
});