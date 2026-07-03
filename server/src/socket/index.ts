import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected', socket.id);

    socket.on('disconnect', (reason) => {
      console.log('Client disconnected', socket.id, reason);
    });
  });

  return io;
};