import { randomInt } from 'node:crypto';

export type RoomStatus = 'waiting';

export interface Room {
  roomCode: string;
  hostId: string;
  players: string[];
  maxPlayers: number;
  status: RoomStatus;
}

export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  createRoom(hostId: string): Room {
    const roomCode = this.generateUniqueRoomCode();

    const room: Room = {
      roomCode,
      hostId,
      players: [hostId],
      maxPlayers: 5,
      status: 'waiting'
    };

    this.rooms.set(roomCode, room);

    return room;
  }

  getRoomByCode(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
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
