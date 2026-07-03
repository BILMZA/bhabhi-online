"use client";

import { useState } from "react";
import { GameScreen } from "@/components/GameScreen";
import { LobbyEntryForm } from "@/components/LobbyEntryForm";
import { LobbyView } from "@/components/LobbyView";
import { ResultsScreen } from "@/components/ResultsScreen";
import { useSocket } from "@/hooks/useSocket";

export const LobbyApp = () => {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const {
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
  } = useSocket();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#e2e8f0_0%,_#f8fafc_40%,_#ffffff_100%)] px-4 py-8 text-slate-950 dark:bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#020617_50%,_#020617_100%)] dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="grid gap-3 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            Bhabhi Online
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Multiplayer lobby
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Connect, create a room, or join an existing lobby to get everyone ready.
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
            Connection: {connectionState}
          </p>
        </header>

        {error ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            <span>{error}</span>
            <button type="button" onClick={clearError} className="text-sm font-semibold">
              Dismiss
            </button>
          </div>
        ) : null}

        {gameResult ? (
          <ResultsScreen
            finalStandings={gameResult.finalStandings}
            winnerIds={gameResult.winnerIds}
            bhabhiPlayerId={gameResult.bhabhiPlayerId}
            onReturnToLobby={returnToLobby}
          />
        ) : gameState ? (
          <GameScreen
            gameState={gameState}
            trickWinnerName={
              trickResult
                ? gameState.players.find((player) => player.id === trickResult.winnerId)?.name ??
                  null
                : null
            }
            socketId={socketId}
            resolvedTrickCards={resolvedTrickCards}
            onPlayCard={playCard}
          />
        ) : room ? (
          <LobbyView
            room={room}
            onLeaveRoom={leaveRoom}
            onStartGame={startGame}
            canStartGame={Boolean(room && room.hostId === socketId)}
          />
        ) : (
          <LobbyEntryForm
            playerName={playerName}
            roomCode={roomCode}
            onPlayerNameChange={setPlayerName}
            onRoomCodeChange={setRoomCode}
            onCreateRoom={() => createRoom(playerName)}
            onJoinRoom={() => joinRoom(roomCode, playerName)}
          />
        )}
      </div>
    </main>
  );
};