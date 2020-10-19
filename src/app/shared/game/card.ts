
export enum CardValues {
  Jack = 11,
  Queen = 12,
  King = 13,
  Joker = 0,
}

export enum CardSuits {
  Stars = 'Stars',
  Hearts = 'Hearts',
  Clubs = 'Clubs',
  Spades = 'Spades',
  Diamonds = 'Diamonds',
}

const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const suits = Object.keys(CardSuits);

export class Card {
  value: number;
  suit?: string;

  constructor(value: number, suit?: string) {
    this.value = value;
    this.suit = suit;
  }

  serialize(): string {
    let code = 0;
    if (this.value !== CardValues.Joker) {
      code = (this.value - 3) * suits.length + suits.indexOf(this.suit) + 1;
    }
    return base64[code];
  }

  static deserialize(value: string): Card {
    let code = base64.indexOf(value);
    if (code < 0) {
      throw new Error('Invalid Card Code');
    } else if (code == 0) {
      return new Card(CardValues.Joker);
    } else {
      code--;
      const div = Math.floor(code / suits.length);
      const mod = code % suits.length;
      return new Card(div + 3, suits[mod]);
    }
  }

  isWild(round: number): boolean {
    return this.value === CardValues.Joker || this.value === round + 2;
  }
}
