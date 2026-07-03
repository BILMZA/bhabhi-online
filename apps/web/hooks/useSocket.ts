"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

export type LobbyPlayer = {
  id: string;
  name: string;
};

export type LobbyRoom = {
  roomCode: string;
  hostId: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  status: "waiting" | "playing";
};

export type GameCard = {
  suit: "clubs" | "diamonds" | "hearts" | "spades";
  rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
};

export type GamePlayer = {
  id: string;
  name: string;
  cardCount: number;
};

export type GameState = {
  roomCode: string;
  dealerId: string;
  currentTurnPlayerId: string;
  players: GamePlayer[];
  hand: GameCard[];
  tableCards: Array<{ playerId: string; card: GameCard }>;
  status: "active";
};

export type FinalStanding = {
  rank: number;
  playerId: string;
  playerName: string;
  tricksWon: number;
};

type PendingAction =
  | { type: "create"; playerName: string }
  | { type: "join"; roomCode: string; playerName: string }
  | null;

type RoomCreatedPayload = {
  roomCode: string;
};

type RoomSnapshotPayload = LobbyRoom;

type GameStartedPayload = {
  gameState: GameState;
};

type CardPlayedPayload = {
  roomCode: string;
  playerId: string;
  card: GameCard;
  nextTurnPlayerId: string;
  players: GamePlayer[];
  tableCards: Array<{ playerId: string; card: GameCard }>;
  trickEnded?: TrickEndedPayload;
};

type TrickEndedPayload = {
  roomCode: string;
  winnerId: string;
  winningCard: GameCard;
  playedCards: Array<{ playerId: string; card: GameCard }>;
  nextTurn: string;
  players: GamePlayer[];
};

type GameEndedPayload = {
  roomCode: string;
  finalStandings: FinalStanding[];
  tricksWonByPlayerId: Record<string, number>;
  winnerIds: string[];
  bhabhiPlayerId: string;
};

type ReturnToLobbyPayload = {
  roomCode: string;
};

type PlayerJoinedPayload = {
  player: LobbyPlayer;
};

type PlayerLeftPayload = {
  playerId: string;
};

type ErrorPayload = {
  message: string;
};

export const useSocket = () => {
  const socket = useMemo(() => getSocket(), []);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "disconnected"
  >(socket.connected ? "connected" : "disconnected");
  const [room, setRoom] = useState<LobbyRoom | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [trickResult, setTrickResult] = useState<TrickEndedPayload | null>(null);
  const [gameResult, setGameResult] = useState<GameEndedPayload | null>(null);
  const [resolvedTrickCards, setResolvedTrickCards] = useState<
    Array<{ playerId: string; card: GameCard }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const pendingActionRef = useRef<PendingAction>(null);

  useEffect(() => {
    const handleConnect = () => {
      setConnectionState("connected");
      setSocketId(socket.id ?? null);
    };

    const handleDisconnect = () => {
      setConnectionState("disconnected");
      setSocketId(null);
    };

    const handleRoomCreated = (payload: RoomCreatedPayload) => {
      const pendingAction = pendingActionRef.current;

      if (!pendingAction || pendingAction.type !== "create" || !socket.id) {
        return;
      }

      setRoom({
        roomCode: payload.roomCode,
        hostId: socket.id,
        players: [
          {
            id: socket.id,
            name: pendingAction.playerName
          }
        ],
        maxPlayers: 5,
        status: "waiting"
      });

      pendingActionRef.current = null;
    };

    const handleRoomSnapshot = (payload: RoomSnapshotPayload) => {
      setRoom(payload);
      pendingActionRef.current = null;
    };

    const handlePlayerJoined = (payload: PlayerJoinedPayload) => {
      setRoom((currentRoom) => {
        if (!currentRoom) {
          return currentRoom;
        }

        if (currentRoom.players.some((player) => player.id === payload.player.id)) {
          return currentRoom;
        }

        return {
          ...currentRoom,
          players: [...currentRoom.players, payload.player]
        };
      });

      if (pendingActionRef.current?.type === "join") {
        pendingActionRef.current = null;
      }
    };

    const handlePlayerLeft = (payload: PlayerLeftPayload) => {
      setRoom((currentRoom) => {
        if (!currentRoom) {
          return currentRoom;
        }

        const nextPlayers = currentRoom.players.filter(
          (player) => player.id !== payload.playerId
        );

        if (nextPlayers.length === 0) {
          return null;
        }

        const nextHostId =
          currentRoom.hostId === payload.playerId
            ? nextPlayers[0].id
            : currentRoom.hostId;

        return {
          ...currentRoom,
          hostId: nextHostId,
          players: nextPlayers
        };
      });
    };

    const handleError = (payload: ErrorPayload) => {
      setError(payload.message);
    };

    const handleGameStarted = (payload: GameStartedPayload) => {
      setGameState(payload.gameState);
      setTrickResult(null);
      setGameResult(null);
      setResolvedTrickCards([]);
      setRoom((currentRoom) => {
        if (!currentRoom) {
          return currentRoom;
        }

        return {
          ...currentRoom,
          status: "playing"
        };
      });
      pendingActionRef.current = null;
    };

    const handleCardPlayed = (payload: CardPlayedPayload) => {
      setResolvedTrickCards([]);

      setGameState((currentGameState) => {
        if (!currentGameState || currentGameState.roomCode !== payload.roomCode) {
          return currentGameState;
        }

        return {
          ...currentGameState,
          currentTurnPlayerId: payload.nextTurnPlayerId,
          players: payload.players,
          hand:
            payload.playerId === socket.id
              ? currentGameState.hand.filter(
                  (entry) =>
                    !(entry.rank === payload.card.rank && entry.suit === payload.card.suit)
                )
              : currentGameState.hand,
          tableCards: payload.tableCards
        };
      });

      setTrickResult(null);
    };

    const handleTrickEnded = (payload: TrickEndedPayload) => {
      setTrickResult(payload);
      setResolvedTrickCards(payload.playedCards);

      setGameState((currentGameState) => {
        if (!currentGameState || currentGameState.roomCode !== payload.roomCode) {
          return currentGameState;
        }

        return {
          ...currentGameState,
          currentTurnPlayerId: payload.nextTurn,
          players: payload.players,
          tableCards: []
        };
      });
    };

    const handleGameEnded = (payload: GameEndedPayload) => {
      setGameResult(payload);
      setGameState(null);
      setTrickResult(null);
      setResolvedTrickCards([]);
      setRoom((currentRoom) => {
        if (!currentRoom) {
          return currentRoom;
        }

        return {
          ...currentRoom,
          status: "waiting"
        };
      });
    };

    const handleReturnToLobby = (_payload: ReturnToLobbyPayload) => {
      setGameState(null);
      setGameResult(null);
      setTrickResult(null);
      setResolvedTrickCards([]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room-created", handleRoomCreated);
    socket.on("room-snapshot", handleRoomSnapshot);
    socket.on("player-joined", handlePlayerJoined);
    socket.on("player-left", handlePlayerLeft);
    socket.on("game-started", handleGameStarted);
    socket.on("card-played", handleCardPlayed);
    socket.on("trick-ended", handleTrickEnded);
    socket.on("game-ended", handleGameEnded);
    socket.on("return-to-lobby", handleReturnToLobby);
    socket.on("error", handleError);

    if (!socket.connected) {
      setConnectionState("connecting");
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room-created", handleRoomCreated);
      socket.off("room-snapshot", handleRoomSnapshot);
      socket.off("player-joined", handlePlayerJoined);
      socket.off("player-left", handlePlayerLeft);
      socket.off("game-started", handleGameStarted);
      socket.off("card-played", handleCardPlayed);
      socket.off("trick-ended", handleTrickEnded);
      socket.off("game-ended", handleGameEnded);
      socket.off("return-to-lobby", handleReturnToLobby);
      socket.off("error", handleError);
    };
  }, [socket]);

  const createRoom = (playerName: string) => {
    const trimmedName = playerName.trim();

    if (!trimmedName) {
      setError("Player name is required");
      return;
    }

    setError(null);
    pendingActionRef.current = { type: "create", playerName: trimmedName };
    socket.emit("create-room", { playerName: trimmedName });
  };

  const joinRoom = (roomCode: string, playerName: string) => {
    const trimmedRoomCode = roomCode.trim().toUpperCase();
    const trimmedName = playerName.trim();

    if (!trimmedRoomCode) {
      setError("Room code is required");
      return;
    }

    if (!trimmedName) {
      setError("Player name is required");
      return;
    }

    setError(null);
    pendingActionRef.current = {
      type: "join",
      roomCode: trimmedRoomCode,
      playerName: trimmedName
    };
    socket.emit("join-room", { roomCode: trimmedRoomCode, playerName: trimmedName });
  };

  const leaveRoom = () => {
    if (!room) {
      return;
    }

    setError(null);
    socket.emit("leave-room", { roomCode: room.roomCode });
    setRoom(null);
    setGameState(null);
    setGameResult(null);
    setTrickResult(null);
    setResolvedTrickCards([]);
    pendingActionRef.current = null;
  };

  const returnToLobby = () => {
    if (!room) {
      return;
    }

    setError(null);
    socket.emit("play-again", { roomCode: room.roomCode });
  };

  const startGame = () => {
    if (!room || room.hostId !== socketId) {
      return;
    }

    setError(null);
    socket.emit("start-game", { roomCode: room.roomCode });
  };

  const playCard = (card: GameCard) => {
    if (!gameState) {
      return;
    }

    setError(null);
    socket.emit("play-card", {
      roomCode: gameState.roomCode,
      card
    });
  };

  const clearError = () => {
    setError(null);
  };

  return {
    connectionState,
    socketId,
    error,
    room,
    gameState,
    trickResult,
    gameResult,
    resolvedTrickCards,
    createRoom,
    joinRoom,
    leaveRoom,
    returnToLobby,
    startGame,
    playCard,
    clearError
  };
};