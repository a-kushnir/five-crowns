
export enum CardValues {
  Jack = 11,
  Queen = 12,
  King = 13,
  Joker = 25,
}

export enum CardSuits {
  Stars = 'Stars',
  Hearts = 'Hearts',
  Clubs = 'Clubs',
  Spades = 'Spades',
  Diamonds = 'Diamonds',
}

export class Card {
  value: number;
  suit?: string;
}
