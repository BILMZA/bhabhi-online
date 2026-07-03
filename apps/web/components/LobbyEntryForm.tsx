"use client";

type LobbyEntryFormProps = {
  playerName: string;
  roomCode: string;
  onPlayerNameChange: (value: string) => void;
  onRoomCodeChange: (value: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  disabled?: boolean;
};

export const LobbyEntryForm = ({
  playerName,
  roomCode,
  onPlayerNameChange,
  onRoomCodeChange,
  onCreateRoom,
  onJoinRoom,
  disabled = false
}: LobbyEntryFormProps) => {
  return (
    <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:bg-slate-950/70">
      <div className="grid gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="player-name">
          Player name
        </label>
        <input
          id="player-name"
          value={playerName}
          onChange={(event) => onPlayerNameChange(event.target.value)}
          placeholder="Enter your name"
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          disabled={disabled}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={onCreateRoom}
          className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          disabled={disabled}
        >
          Create Room
        </button>
      </div>

      <div className="grid gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="room-code">
          Join Room
        </label>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            id="room-code"
            value={roomCode}
            onChange={(event) => onRoomCodeChange(event.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 uppercase tracking-[0.3em] text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={onJoinRoom}
            className="h-12 rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-900"
            disabled={disabled}
          >
            Join Room
          </button>
        </div>
      </div>
    </section>
  );
};