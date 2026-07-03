import { randomInt } from 'node:crypto';
import type { Card } from '../types/card';

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffledDeck = [...deck];

  for (let index = shuffledDeck.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(index + 1);
    const temp = shuffledDeck[index];

    shuffledDeck[index] = shuffledDeck[randomIndex];
    shuffledDeck[randomIndex] = temp;
  }

  return shuffledDeck;
};