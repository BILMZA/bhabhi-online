import { io, type Socket } from "socket.io-client";

const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://127.0.0.1:3001";

console.log("SOCKET URL =", socketUrl);

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (typeof window === "undefined") {
    // Should never be called server-side, but guard just in case.
    throw new Error("getSocket() must only be called in the browser.");
  }

  if (!socketInstance) {
    socketInstance = io(socketUrl, {
      autoConnect: false
    });
  }

  return socketInstance;
};