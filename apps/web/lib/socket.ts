import { io, type Socket } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

let socketInstance: Socket | null = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(socketUrl, {
      autoConnect: false,
      transports: ["websocket"]
    });
  }

  return socketInstance;
};