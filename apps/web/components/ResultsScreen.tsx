"use client";

import type { FinalStanding } from "@/hooks/useSocket";

type ResultsScreenProps = {
  finalStandings: FinalStanding[];
  winnerIds: string[];
  bhabhiPlayerId: string;
  onReturnToLobby: () => void;
};

export const ResultsScreen = ({
  finalStandings,
  winnerIds,
  bhabhiPlayerId,
  onReturnToLobby
}: ResultsScreenProps) => {
  const bhabhiStanding = finalStandings.find((standing) => standing.playerId === bhabhiPlayerId);

  return (
    <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:bg-slate-950/70">
      <div className="grid gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Match complete
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Final results
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Winner(s)</p>
          <ul className="mt-2 grid gap-1 text-lg font-semibold text-slate-950 dark:text-white">
            {finalStandings
              .filter((standing) => standing.playerId !== bhabhiPlayerId)
              .map((standing) => (
                <li key={standing.playerId}>{standing.playerName}</li>
              ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Bhabhi</p>
          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            {bhabhiStanding?.playerName ?? "Unknown"}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Tricks won by each player
        </p>
        <ul className="grid gap-2">
          {finalStandings.map((standing) => (
            <li
              key={standing.playerId}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <span>{standing.playerName}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {standing.tricksWon} tricks
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Final ranking</p>
        <ol className="grid gap-2">
          {finalStandings.map((standing) => (
            <li
              key={standing.playerId}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <span>
                #{standing.rank} {standing.playerName}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {standing.tricksWon} tricks
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <p>Winner ids: {winnerIds.join(", ") || "None"}</p>
        <p>Bhabhi player id: {bhabhiPlayerId}</p>
      </div>

      <button
        type="button"
        onClick={onReturnToLobby}
        className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
      >
        Return to Lobby
      </button>
    </section>
  );
};