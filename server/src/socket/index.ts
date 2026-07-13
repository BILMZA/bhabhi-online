import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { GameManager } from '../services/GameManager';
import { RoomManager } from '../services/RoomManager';
const pendingThullas = new Map<string, { playerId: string; expiresAt: number }>();
interface CreateRoomPayload {
  playerName?: string;
}

interface JoinRoomPayload {
  roomCode?: string;
  playerName?: string;
}

interface LeaveRoomPayload {
  roomCode?: string;
}

interface StartGamePayload {
  roomCode?: string;
}

interface PlayCardPayload {
  roomCode?: string;
  card?: {
    suit?: 'clubs' | 'diamonds' | 'hearts' | 'spades';
    rank?: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
  };
}

interface PlayAgainPayload {
  roomCode?: string;
}

const roomManager = new RoomManager();
const gameManager = new GameManager();

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong';
};

const getActiveRoomCode = (socket: Socket): string | null => {
  for (const joinedRoom of socket.rooms) {
    if (joinedRoom !== socket.id) {
      return joinedRoom;
    }
  }

  return null;
};

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  });

 io.engine.on('connection_error', (err) => {
    console.log('CONNECTION ERROR:', err.code, err.message, err.context);
  });

  io.on('connection', (socket) => {
    console.log('Client connected', socket.id);

    socket.on('create-room', (payload: CreateRoomPayload = {}) => {
      try {
        const playerName = payload.playerName?.trim();

        if (!playerName) {
          throw new Error('Player name is required');
        }

        const room = roomManager.createRoom(socket.id, playerName);

        socket.join(room.roomCode);
        io.to(room.roomCode).emit('room-created', {
          roomCode: room.roomCode
        });
      } catch (error) {
        socket.emit('error', {
          message: getErrorMessage(error)
        });
      }
    });

    socket.on('join-room', (payload: JoinRoomPayload = {}) => {
      try {
        const roomCode = payload.roomCode?.trim();
        const playerName = payload.playerName?.trim();

        if (!roomCode) {
          throw new Error('Room code is required');
        }

        if (!playerName) {
          throw new Error('Player name is required');
        }

        const { player } = roomManager.joinRoom(roomCode, socket.id, playerName);
        const room = roomManager.getRoomByCode(roomCode);

        if (!room) {
          throw new Error('Room not found');
        }

        socket.join(roomCode);
        socket.emit('room-snapshot', room);
        socket.to(roomCode).emit('player-joined', {
          player
        });
      } catch (error) {
        socket.emit('error', {
          message: getErrorMessage(error)
        });
      }
    });

    socket.on('leave-room', (payload: LeaveRoomPayload = {}) => {
      try {
        const roomCode = payload.roomCode?.trim();

        if (!roomCode) {
          throw new Error('Room code is required');
        }

        const { player } = roomManager.leaveRoom(roomCode, socket.id);

        socket.leave(roomCode);
        socket.to(roomCode).emit('player-left', {
          playerId: player.id
        });
      } catch (error) {
        socket.emit('error', {
          message: getErrorMessage(error)
        });
      }
    });

    socket.on('start-game', (_payload: StartGamePayload = {}) => {
      try {
        const roomCode = getActiveRoomCode(socket);

        if (!roomCode) {
          throw new Error('You are not in a room');
        }

        const room = roomManager.getRoomByCode(roomCode);

        if (!room) {
          throw new Error('Room not found');
        }

        if (room.hostId !== socket.id) {
          throw new Error('Only the host can start the game');
        }

        const gameState = gameManager.startGame(room);

        roomManager.setRoomStatus(roomCode, 'playing');

        for (const player of room.players) {
          const playerSocket = io.sockets.sockets.get(player.id);

          if (!playerSocket) {
            throw new Error('All players must be connected to start the game');
          }

          playerSocket.emit('game-started', {
            gameState: gameManager.getPlayerStartState(gameState, player.id)
          });
        }
      } catch (error) {
        socket.emit('error', {
          message: getErrorMessage(error)
        });
      }
    });

    socket.on('play-card', (payload: PlayCardPayload = {}) => {
      try {
        const roomCode = payload.roomCode?.trim() || getActiveRoomCode(socket);

        if (!roomCode) {
          throw new Error('You are not in a room');
        }

        const card = payload.card;

        if (!card?.suit || !card.rank) {
          throw new Error('Card is required');
        }

        const result = gameManager.playCard(roomCode, socket.id, {
          suit: card.suit,
          rank: card.rank
        });

        io.to(roomCode).emit('card-played', result);
        
           if (result.thullaBreakerId) {
          const expiresAt = Date.now() + 5000;
          pendingThullas.set(roomCode, {
            playerId: result.thullaBreakerId,
            expiresAt
          });

          io.to(roomCode).emit('thulla-declared', {
            playerId: result.thullaBreakerId,
            expiresAt
          });

          setTimeout(() => {
            const pending = pendingThullas.get(roomCode);
            if (pending && pending.expiresAt <= Date.now()) {
              pendingThullas.delete(roomCode);
            }
          }, 5100);
        }

        if (result.thullaRecipientId) {
          const receiver = gameManager.getGame(roomCode)?.players.find((p) => p.id === result.thullaRecipientId);
          if (receiver) {
            io.to(result.thullaRecipientId).emit('hand-updated', {
              hand: receiver.hand
            });
          }
        }

        if (result.trickEnded) {
          io.to(roomCode).emit('trick-ended', result.trickEnded);
        }

        if (result.gameEnded) {
          roomManager.setRoomStatus(roomCode, 'waiting');
          io.to(roomCode).emit('game-ended', result.gameEnded);
        }
      } catch (error) {
        socket.emit('error', {
          message: getErrorMessage(error)
        });
      }
    });


socket.on('thulla-button-clicked', (payload: { roomCode?: string } = {}) => {
      try {
        const roomCode = payload.roomCode?.trim() || getActiveRoomCode(socket);

        if (!roomCode) {
          throw new Error('You are not in a room');
        }

        const pending = pendingThullas.get(roomCode);

        if (!pending) return;                          // no active thulla
        if (pending.playerId !== socket.id) return;     // not the right player
        if (Date.now() > pending.expiresAt) return;      // window expired

        pendingThullas.delete(roomCode);
        io.to(roomCode).emit('thulla-sound');
      } catch (error) {
        socket.emit('error', {
          message: getErrorMessage(error)
        });
      }
    });


    socket.on('play-again', (payload: PlayAgainPayload = {}) => {
      try {
        const roomCode = payload.roomCode?.trim() || getActiveRoomCode(socket);

        if (!roomCode) {
          throw new Error('You are not in a room');
        }

        const room = roomManager.getRoomByCode(roomCode);

        if (!room) {
          throw new Error('Room not found');
        }

        roomManager.setRoomStatus(roomCode, 'waiting');
        io.to(roomCode).emit('return-to-lobby', {
          roomCode
        });
      } catch (error) {
        socket.emit('error', {
          message: getErrorMessage(error)
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Client disconnected', socket.id, reason);
    });
  });

  return io;
};