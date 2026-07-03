"use client";

import type { GameCard, GameState } from "@/hooks/useSocket";

type GameScreenProps = {
  gameState: GameState;
  trickWinnerName: string | null;
  socketId: string | null;
  resolvedTrickCards: Array<{ playerId: string; card: GameCard }>;
  onPlayCard: (card: GameCard) => void;
};

const formatCard = (suit: GameCard["suit"], rank: GameCard["rank"]) => {
  const suitLabel: Record<typeof suit, string> = {
    clubs: "Clubs",
    diamonds: "Diamonds",
    hearts: "Hearts",
    spades: "Spades"
  };

  return `${rank} of ${suitLabel[suit]}`;
};

const getSuitSymbol = (suit: GameCard["suit"]) => {
  switch (suit) {
    case "spades":
      return "♠";
    case "hearts":
      return "♥";
    case "diamonds":
      return "♦";
    case "clubs":
      return "♣";
  }
};

const getSuitColorClass = (suit: GameCard["suit"]) => {
  return suit === "hearts" || suit === "diamonds" ? "text-rose-600" : "text-slate-950";
};

const CardView = ({ card }: { card: GameCard }) => {
  const colorClass = getSuitColorClass(card.suit);

  return (
    <div className={`flex aspect-[3/4] w-full max-w-[110px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-lg transition-transform duration-200 ${colorClass} dark:border-slate-800 dark:bg-slate-50`}>
      <div className="flex items-start justify-between text-base font-semibold leading-none">
        <span>{card.rank}</span>
        <span>{getSuitSymbol(card.suit)}</span>
      </div>
      <div className="flex flex-1 items-center justify-center text-4xl font-semibold">
        {getSuitSymbol(card.suit)}
      </div>
      <div className="flex items-end justify-between text-base font-semibold leading-none">
        <span className="rotate-180">{card.rank}</span>
        <span className="rotate-180">{getSuitSymbol(card.suit)}</span>
      </div>
    </div>
  );
};

export const GameScreen = ({
  gameState,
  trickWinnerName,
  socketId,
  resolvedTrickCards,
  onPlayCard
}: GameScreenProps) => {
  const dealer = gameState.players.find((player) => player.id === gameState.dealerId);
  const currentTurn = gameState.players.find((player) => player.id === gameState.currentTurnPlayerId);
  const isMyTurn = socketId === gameState.currentTurnPlayerId;
  const visibleTableCards = gameState.tableCards.length > 0 ? gameState.tableCards : resolvedTrickCards;

  return (
    <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:bg-slate-950/70">
      <div className="grid gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Room code
        </p>
        <p className="text-4xl font-semibold tracking-[0.2em] text-slate-950 dark:text-white">
          {gameState.roomCode}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Dealer</p>
          <p className="text-lg font-semibold text-slate-950 dark:text-white">
            {dealer?.name ?? "Unknown"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Current turn</p>
          <p className="text-lg font-semibold text-slate-950 dark:text-white">
            {currentTurn?.name ?? "Unknown"}
          </p>
        </div>
      </div>

      {trickWinnerName ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 transition-all duration-300 ease-out dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          Trick won by {trickWinnerName}
        </div>
      ) : null}

      <div className="relative min-h-[360px] rounded-[2rem] border border-slate-200 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] dark:border-slate-800">
        <div className="grid h-full gap-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.3em] text-emerald-100/80">
            <span>Center table</span>
            <span>{visibleTableCards.length} played</span>
          </div>

          <div className="flex items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
            {visibleTableCards.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-4">
                {visibleTableCards.map((entry, index) => (
                  <div key={`${entry.card.rank}-${entry.card.suit}-${index}`} className="animate-[fadeIn_180ms_ease-out]">
                    <CardView card={entry.card} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-emerald-100/80">
                No cards played yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {gameState.players.map((player) => {
            const isDealer = player.id === gameState.dealerId;
            const isCurrentTurn = player.id === gameState.currentTurnPlayerId;

            return (
              <div
                key={player.id}
                className={`rounded-2xl border px-4 py-3 transition-all duration-300 ${
                  isCurrentTurn
                    ? "border-emerald-400 bg-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.35)] dark:border-emerald-500 dark:bg-emerald-950/30"
                    : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {player.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {player.cardCount} cards remaining
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                    {isDealer ? <span>Dealer</span> : null}
                    {isCurrentTurn ? <span>Turn</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Your hand</p>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
            {isMyTurn ? "Your turn" : "Waiting for turn"}
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {gameState.hand.map((card) => (
            <li key={`${card.rank}-${card.suit}`}>
              <button
                type="button"
                onClick={() => onPlayCard(card)}
                disabled={!isMyTurn}
                className="w-full transition-transform duration-200 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CardView card={card} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};