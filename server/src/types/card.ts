export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';

export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export const ACE_OF_SPADES: Card = {
  suit: 'spades',
  rank: 'A'
};