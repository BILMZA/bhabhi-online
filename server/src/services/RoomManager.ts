import { randomInt } from 'node:crypto';

export type RoomStatus = 'waiting' | 'playing';

export interface RoomPlayer {
  id: string;
  name: string;
}

export interface Room {
  roomCode: string;
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  status: RoomStatus;
}

export interface JoinRoomResult {
  room: Room;
  player: RoomPlayer;
}

export interface LeaveRoomResult {
  roomCode: string;
  player: RoomPlayer;
  roomDeleted: boolean;
}

export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  createRoom(hostId: string, hostName: string): Room {
    const roomCode = this.generateUniqueRoomCode();

    const room: Room = {
      roomCode,
      hostId,
      players: [
        {
          id: hostId,
          name: hostName
        }
      ],
      maxPlayers: 5,
      status: 'waiting'
    };

    this.rooms.set(roomCode, room);

    return room;
  }

  getRoomByCode(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  joinRoom(roomCode: string, playerId: string, playerName: string): JoinRoomResult {
    const room = this.rooms.get(roomCode);

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'waiting') {
      throw new Error('Game already started');
    }

    if (room.players.some((player) => player.id === playerId)) {
      throw new Error('Player already in room');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    const player: RoomPlayer = {
      id: playerId,
      name: playerName
    };

    room.players.push(player);

    return {
      room,
      player
    };
  }

  setRoomStatus(roomCode: string, status: RoomStatus): void {
    const room = this.rooms.get(roomCode);

    if (!room) {
      throw new Error('Room not found');
    }

    room.status = status;
  }

  leaveRoom(roomCode: string, playerId: string): LeaveRoomResult {
    const room = this.rooms.get(roomCode);

    if (!room) {
      throw new Error('Room not found');
    }

    const playerIndex = room.players.findIndex((player) => player.id === playerId);

    if (playerIndex === -1) {
      throw new Error('Player not in room');
    }

    const [player] = room.players.splice(playerIndex, 1);

    if (room.players.length > 0 && room.hostId === playerId) {
      room.hostId = room.players[0].id;
    }

    const roomDeleted = room.players.length === 0;

    if (roomDeleted) {
      this.rooms.delete(roomCode);
    }

    return {
      roomCode,
      player,
      roomDeleted
    };
  }

  deleteEmptyRooms(): void {
    for (const [roomCode, room] of this.rooms.entries()) {
      if (room.players.length === 0) {
        this.rooms.delete(roomCode);
      }
    }
  }

  private generateUniqueRoomCode(): string {
    let roomCode = '';

    do {
      roomCode = this.generateRoomCode();
    } while (this.rooms.has(roomCode));

    return roomCode;
  }

  private generateRoomCode(): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let index = 0; index < 6; index += 1) {
      code += alphabet[randomInt(alphabet.length)];
    }

    return code;
  }
}
