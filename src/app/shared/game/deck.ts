import {Card, CardSuits, CardValues} from "./card";

export class Deck {
  cards: Card[] = [];

  get length(): number {
    return this.cards.length;
  }

  get empty(): boolean {
    return this.length === 0;
  }

  static create(): Deck {
    let deck = new Deck();

    const decks = 2;
    for (let count = 1; count <= decks; count++) {
      Object.keys(CardSuits).forEach(suit => {
        for (let value = 3; value <= CardValues.King; value++) {
          deck.cards.push({value, suit: suit})
        }
      });
      for (let count = 1; count <= 3; count++) {
        deck.cards.push({value: CardValues.Joker})
      }
    }

    return deck;
  }

  static encode(deck: Deck): string {
    return deck.cards.map(card => Card.encode(card)).join('');
  }

  static decode(value: string): Deck {
    const deck = new Deck();
    for (const c of value) {
      deck.cards.push(Card.decode(c));
    }
    return deck;
  }

  push(...cards: Card[]): void {
    this.cards.push(...cards);
  }

  drawCard(): Card {
    return this.drawCards(1)[0];
  }

  drawCards(count: number): Card[] {
    return this.length >= count ? this.cards.splice(0, count) : [];
  }

  discard(index: number): Card {
    if (index < 0 || index >= this.cards.length) {
      throw new Error("Player doesn't have the card");
    }
    return this.cards.splice(index, 1)[0];
  }

  shuffle(): void {
    // Fisher-Yates (aka Knuth) Shuffle
    const array = this.cards;
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  }
}