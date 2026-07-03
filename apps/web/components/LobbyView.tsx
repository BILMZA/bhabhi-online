"use client";

import type { LobbyRoom } from "@/hooks/useSocket";

type LobbyViewProps = {
  room: LobbyRoom;
  onLeaveRoom: () => void;
  onStartGame: () => void;
  canStartGame: boolean;
};

export const LobbyView = ({ room, onLeaveRoom, onStartGame, canStartGame }: LobbyViewProps) => {
  const host = room.players.find((player) => player.id === room.hostId) ?? room.players[0];

  return (
    <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:bg-slate-950/70">
      <div className="grid gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Room code
        </p>
        <p className="text-4xl font-semibold tracking-[0.2em] text-slate-950 dark:text-white">
          {room.roomCode}
        </p>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Host</p>
        <p className="text-lg font-semibold text-slate-950 dark:text-white">
          {host ? host.name : "Unknown"}
        </p>
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Connected players</p>
        <ul className="grid gap-2">
          {room.players.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <span>{player.name}</span>
              {player.id === room.hostId ? (
                <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                  Host
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {canStartGame ? (
          <button
            type="button"
            onClick={onStartGame}
            className="h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Start Game
          </button>
        ) : null}

        <button
          type="button"
          onClick={onLeaveRoom}
          className="h-12 rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          Leave Room
        </button>
      </div>
    </section>
  );
};