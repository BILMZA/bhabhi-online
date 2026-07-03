import http from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { initSocket } from './socket';

const app = createApp();
const server = http.createServer(app);

initSocket(server);

server.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});