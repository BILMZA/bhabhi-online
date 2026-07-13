import type { Card } from '../types/card';
import { ACE_OF_SPADES } from '../types/card';
import { createDeck } from '../utils/createDeck';
import { shuffleDeck } from '../utils/shuffleDeck';
import type { Room } from './RoomManager';

export interface TableCard {
  playerId: string;
  card: Card;
}

export interface GamePlayerState {
  id: string;
  name: string;
  hand: Card[];
  collectedCards: Card[];
}

export interface GameState {
  roomCode: string;
  dealerId: string;
  currentTurnPlayerId: string;
  players: GamePlayerState[];
  deck: Card[];
  tableCards: TableCard[];
  currentTrickPlayerIds: string[];
  tricksWonByPlayerId: Record<string, number>;
  finishedPlayerIds: string[];
  lastTrickWinnerId?: string;
  lastTrickWinningCard?: Card;
  status: 'active';
}

export interface PlayerStartState {
  roomCode: string;
  dealerId: string;
  currentTurnPlayerId: string;
  players: Array<{
    id: string;
    name: string;
    cardCount: number;
    collectedCards: Card[];
  }>;
  hand: Card[];
  tableCards: TableCard[];
}

export interface TrickEndedResult {
  roomCode: string;
  winnerId: string;
  winningCard: Card;
  playedCards: TableCard[];
  nextTurn: string;
  players: Array<{
    id: string;
    name: string;
    cardCount: number;
    collectedCards: Card[];
  }>;
}

export interface FinalStanding {
  rank: number;
  playerId: string;
  playerName: string;
  tricksWon: number;
}

export interface GameEndedResult {
  roomCode: string;
  finalStandings: FinalStanding[];
  tricksWonByPlayerId: Record<string, number>;
  winnerIds: string[];
  bhabhiPlayerId: string;
}

export interface CardPlayedResult {
  roomCode: string;
  playerId: string;
  card: Card;
  nextTurnPlayerId: string;
  thullaRecipientId?: string;
  thullaBreakerId?: string;
  players: Array<{
    id: string;
    name: string;
    cardCount: number;
    collectedCards: Card[];
  }>;
  tableCards: TableCard[];
  trickEnded?: TrickEndedResult;
  gameEnded?: GameEndedResult;
}

export class GameManager {
  private readonly games = new Map<string, GameState>();
  private readonly completedGames = new Map<string, GameEndedResult>();

  startGame(room: Room): GameState {
    if (this.games.has(room.roomCode)) {
      throw new Error('Game already started');
    }

    if (room.players.length < 2 || room.players.length > 5) {
      throw new Error('Room must contain between 2 and 5 players');
    }

    const shuffledDeck = shuffleDeck(createDeck());
    const hands = this.dealCards(shuffledDeck, room.players.length);
    const players: GamePlayerState[] = room.players.map((player, index) => ({
      id: player.id,
      name: player.name,
      hand: hands[index],
      collectedCards: []
    }));

    const dealerIndex = players.findIndex((player) =>
      player.hand.some((card) => card.suit === ACE_OF_SPADES.suit && card.rank === ACE_OF_SPADES.rank)
    );

    if (dealerIndex === -1) {
      throw new Error('Dealer could not be determined');
    }

    const dealerId = players[dealerIndex].id;
    const currentTurnPlayerId = players[(dealerIndex + 1) % players.length].id;

    const gameState: GameState = {
      roomCode: room.roomCode,
      dealerId,
      currentTurnPlayerId,
      players,
      deck: shuffledDeck,
      tableCards: [],
      currentTrickPlayerIds: players.map((player) => player.id),
      tricksWonByPlayerId: Object.fromEntries(players.map((player) => [player.id, 0])),
      finishedPlayerIds: [],
      lastTrickWinnerId: undefined,
      lastTrickWinningCard: undefined,
      status: 'active'
    };

    this.games.set(room.roomCode, gameState);

    return gameState;
  }

  playCard(roomCode: string, playerId: string, card: Card): CardPlayedResult {
    const gameState = this.games.get(roomCode);

    if (!gameState) {
      throw new Error('Game not found');
    }

    if (gameState.currentTurnPlayerId !== playerId) {
      throw new Error('It is not your turn');
    }

    const playerIndex = gameState.players.findIndex((entry) => entry.id === playerId);

    if (playerIndex === -1) {
      throw new Error('Player not found in game');
    }

    const player = gameState.players[playerIndex];
    const cardIndex = player.hand.findIndex(
      (entry) => entry.suit === card.suit && entry.rank === card.rank
    );

    if (cardIndex === -1) {
      throw new Error('You do not have that card');
    }

    const leadSuit = gameState.tableCards[0]?.card.suit;
    let isThulla = false;

    if (leadSuit) {
      const hasLeadSuit = player.hand.some((entry) => entry.suit === leadSuit);

      if (hasLeadSuit && card.suit !== leadSuit) {
        throw new Error(`You must follow suit: ${leadSuit}`);
      }

      isThulla = !hasLeadSuit && card.suit !== leadSuit;
    }

    const [playedCard] = player.hand.splice(cardIndex, 1);

    if (player.hand.length === 0 && !gameState.finishedPlayerIds.includes(playerId)) {
      gameState.finishedPlayerIds.push(playerId);
    }

    let nextTurnPlayerId: string;
    let trickEnded = false;
    let playedCards: TableCard[];

    if (isThulla) {
      const receiverId = gameState.tableCards[0]?.playerId;

      if (!receiverId) {
        throw new Error('Cannot resolve thulla without a lead player');
      }

      const receiver = gameState.players.find((entry) => entry.id === receiverId);

      if (!receiver) {
        throw new Error('Receiver not found');
      }

      // Gather cards to transfer (table cards + thulla card)
      const cardsToTransfer = [
        ...gameState.tableCards.map((tc) => tc.card),
        playedCard
      ];

      // Remove the transferred cards from the table state
      gameState.tableCards = [];
      playedCards = [];

      // Add the transferred cards to the receiver's hand
      receiver.hand.push(...cardsToTransfer);

      gameState.currentTrickPlayerIds = gameState.players
        .filter((entry) => entry.hand.length > 0)
        .map((entry) => entry.id);
      nextTurnPlayerId = gameState.players.some((entry) => entry.id === receiverId && entry.hand.length > 0)
        ? receiverId
        : this.getNextActivePlayerId(gameState, receiverId);
      gameState.currentTurnPlayerId = nextTurnPlayerId;
    } else {
      gameState.tableCards.push({
        playerId,
        card: playedCard
      });

      playedCards = [...gameState.tableCards];
      trickEnded = gameState.tableCards.length === gameState.currentTrickPlayerIds.length;
      nextTurnPlayerId = trickEnded
        ? this.resolveTrick(gameState)
        : this.getNextTurnPlayerId(gameState, playerId);
      gameState.currentTurnPlayerId = nextTurnPlayerId;
    }

    const result: CardPlayedResult = {
      roomCode,
      playerId,
      card: playedCard,
      nextTurnPlayerId,
      players: gameState.players.map((entry) => ({
        id: entry.id,
        name: entry.name,
        cardCount: entry.hand.length,
        collectedCards: [...entry.collectedCards]
      })),
      tableCards: playedCards
    };

    if (isThulla) {
      result.thullaRecipientId = nextTurnPlayerId;
      result.thullaBreakerId = playerId;
    }

    if (trickEnded) {
      result.trickEnded = {
        roomCode,
        winnerId: gameState.lastTrickWinnerId ?? nextTurnPlayerId,
        winningCard: gameState.lastTrickWinningCard ?? playedCard,
        playedCards,
        nextTurn: nextTurnPlayerId,
        players: gameState.players.map((entry) => ({
          id: entry.id,
          name: entry.name,
          cardCount: entry.hand.length,
          collectedCards: [...entry.collectedCards]
        }))
      };

      if (this.isGameFinished(gameState)) {
        result.gameEnded = this.finishGame(gameState);
      }
    }

    return result;
  }

  getGame(roomCode: string): GameState | undefined {
    return this.games.get(roomCode);
  }

  getPlayerStartState(gameState: GameState, playerId: string): PlayerStartState {
    const player = gameState.players.find((entry) => entry.id === playerId);

    if (!player) {
      throw new Error('Player not found in game');
    }

    return {
      roomCode: gameState.roomCode,
      dealerId: gameState.dealerId,
      currentTurnPlayerId: gameState.currentTurnPlayerId,
      players: gameState.players.map((entry) => ({
        id: entry.id,
        name: entry.name,
        cardCount: entry.hand.length
        , collectedCards: [...entry.collectedCards]
      })),
      hand: player.hand,
      tableCards: [...gameState.tableCards]
    };
  }

  getCompletedGame(roomCode: string): GameEndedResult | undefined {
    return this.completedGames.get(roomCode);
  }

  private resolveTrick(gameState: GameState): string {
    const leadSuit = gameState.tableCards[0]?.card.suit;

    if (!leadSuit) {
      throw new Error('Cannot resolve an empty trick');
    }

    const leadSuitCards = gameState.tableCards.filter((entry) => entry.card.suit === leadSuit);

    if (leadSuitCards.length === 0) {
      throw new Error('No cards match the lead suit');
    }

    const winningEntry = leadSuitCards.reduce((highest, current) => {
      return this.getRankValue(current.card.rank) > this.getRankValue(highest.card.rank)
        ? current
        : highest;
    });

    gameState.lastTrickWinnerId = winningEntry.playerId;
    gameState.lastTrickWinningCard = winningEntry.card;
    gameState.tricksWonByPlayerId[winningEntry.playerId] += 1;
    this.transferTrickCards(gameState, winningEntry.playerId, gameState.tableCards);
    gameState.tableCards = [];
    gameState.currentTrickPlayerIds = gameState.players
      .filter((entry) => entry.hand.length > 0)
      .map((entry) => entry.id);

    return this.getNextTurnAfterTrick(gameState, winningEntry.playerId);
  }

  private getNextTurnPlayerId(gameState: GameState, playerId: string): string {
    const currentTrickIds = gameState.currentTrickPlayerIds;
    return this.getNextIdInOrder(gameState, currentTrickIds, playerId);
  }

  private getNextTurnAfterTrick(gameState: GameState, winnerId: string): string {
    const winner = this.getPlayerById(gameState, winnerId);

    if (winner && winner.hand.length > 0) {
      return winnerId;
    }

    const nextActivePlayer = this.getNextActivePlayerAfter(gameState, winnerId);

    if (!nextActivePlayer) {
      return winnerId;
    }

    return nextActivePlayer.id;
  }

  private getNextActivePlayerAfter(gameState: GameState, playerId: string): GamePlayerState | undefined {
    const startIndex = gameState.players.findIndex((entry) => entry.id === playerId);

    if (startIndex === -1) {
      return gameState.players.find((entry) => entry.hand.length > 0);
    }

    for (let offset = 1; offset <= gameState.players.length; offset += 1) {
      const candidate = gameState.players[(startIndex + offset) % gameState.players.length];

      if (candidate.hand.length > 0) {
        return candidate;
      }
    }

    return undefined;
  }

  private getNextActivePlayerId(gameState: GameState, playerId: string): string {
    const nextPlayer = this.getNextActivePlayerAfter(gameState, playerId);

    if (!nextPlayer) {
      return playerId;
    }

    return nextPlayer.id;
  }

  private getNextIdInOrder(gameState: GameState, idsInOrder: string[], playerId: string): string {
    if (idsInOrder.length === 0) {
      return playerId;
    }

    const currentIndex = idsInOrder.indexOf(playerId);

    if (currentIndex === -1) {
      return this.getNextActivePlayerId(gameState, playerId);
    }

    for (let offset = 1; offset <= idsInOrder.length; offset += 1) {
      const nextId = idsInOrder[(currentIndex + offset) % idsInOrder.length];
      const nextPlayer = this.getPlayerById(gameState, nextId);

      if (nextPlayer && nextPlayer.hand.length > 0) {
        return nextId;
      }
    }

    return playerId;
  }

  private transferTrickCards(gameState: GameState, recipientId: string, cards: TableCard[]): void {
    const recipient = this.getPlayerById(gameState, recipientId);

    if (!recipient) {
      throw new Error('Recipient not found in game');
    }

    recipient.collectedCards.push(...cards.map((entry) => entry.card));
  }

  private isGameFinished(gameState: GameState): boolean {
    return gameState.players.every((entry) => entry.hand.length === 0);
  }

  private finishGame(gameState: GameState): GameEndedResult {
    const finalStandings = gameState.finishedPlayerIds.map((playerId, index) => {
      const player = this.getPlayerById(gameState, playerId);

      if (!player) {
        throw new Error('Player not found when finishing game');
      }

      return {
        rank: index + 1,
        playerId: player.id,
        playerName: player.name,
        tricksWon: gameState.tricksWonByPlayerId[player.id] ?? 0
      };
    });

    const bhabhiPlayerId = finalStandings[finalStandings.length - 1]?.playerId;

    if (!bhabhiPlayerId) {
      throw new Error('Bhabhi player could not be determined');
    }

    const winnerIds = finalStandings
      .filter((standing) => standing.playerId !== bhabhiPlayerId)
      .map((standing) => standing.playerId);

    const result: GameEndedResult = {
      roomCode: gameState.roomCode,
      finalStandings,
      tricksWonByPlayerId: { ...gameState.tricksWonByPlayerId },
      winnerIds,
      bhabhiPlayerId
    };

    this.completedGames.set(gameState.roomCode, result);
    this.games.delete(gameState.roomCode);

    return result;
  }

  private getPlayerById(gameState: GameState, playerId: string): GamePlayerState | undefined {
    return gameState.players.find((entry) => entry.id === playerId);
  }

  private getRankValue(rank: Card['rank']): number {
    const rankValues: Record<Card['rank'], number> = {
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      '10': 10,
      J: 11,
      Q: 12,
      K: 13,
      A: 14
    };

    return rankValues[rank];
  }

  private dealCards(deck: Card[], playerCount: number): Card[][] {
    const hands: Card[][] = Array.from({ length: playerCount }, () => []);

    deck.forEach((card, index) => {
      hands[index % playerCount].push(card);
    });

    return hands;
  }
}