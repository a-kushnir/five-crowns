import {Card, CardSuits, CardValues} from "./card";

export class Deck {
  cards: Card[] = [];

  get length(): number {
    return this.cards.length;
  }

  get empty(): boolean {
    return this.length === 0;
  }

  get first(): Card {
    return this.cards.length > 0 ? this.cards[0] : null;
  }

  get last(): Card {
    return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
  }

  static create(): Deck {
    let deck = new Deck();

    const decks = 2;
    for (let count = 1; count <= decks; count++) {
      Object.keys(CardSuits).forEach(suit => {
        for (let value = 3; value <= CardValues.King; value++) {
          deck.cards.push(new Card(value, suit))
        }
      });
      for (let count = 1; count <= 3; count++) {
        deck.cards.push(new Card(CardValues.Joker))
      }
    }

    return deck;
  }

  serialize(): string {
    return this.cards.map(card => card.serialize()).join('');
  }

  static deserialize(value: string): Deck {
    const deck = new Deck();
    if (value) {
      for (const c of value) {
        deck.cards.push(Card.deserialize(c));
      }
    }
    return deck;
  }

  add(...decks: Deck[]) {
    decks.forEach(deck => this.push(...deck.cards));
  }

  push(...cards: Card[]): void {
    this.cards.push(...cards);
  }

  drawCard(): Card {
    return this.drawCards(1)[0];
  }

  drawCards(count: number): Card[] {
    return this.length >= count ? this.cards.splice(-count, count) : [];
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

  moveTo(deck: Deck, ...cards: Card[]): void {
    cards.forEach(card => {
      const index = this.cards.findIndex(c => card.value == c.value && card.suit == c.suit)
      if (index >= 0) {
        deck.push(this.discard(index));
      }
    })
  }

  split(round: number): { regular, wild } {
    const result = {regular: [], wild: []};
    for (let card of this.cards) {
      (card?.isWild(round) ? result.wild : result.regular)
        .push(card);
    }
    result.wild.sort((a, b) => {
      if (a.value != b.value) {
        return a.value < b.value ? 1 : -1;
      } else {
        return a.suit < b.suit ? 1 : -1;
      }
    })
    return result;
  }

  isRun(round: number): boolean {
    if (this.length < 3)
      return false;

    const {regular, wild} = this.split(round);
    if (regular.length < 2)
      return true;

    // No other suits
    if (regular.some(card => card && card.suit !== regular[0].suit))
      return false;

    // No duplicates
    const hash = {}
    regular.forEach(card => hash[card.value] = true)
    if (Object.keys(hash).length !== regular.length) {
      return false;
    }

    // No missing cards
    regular.sort((a, b) => a.value < b.value ? -1 : 1);
    const delta = regular[regular.length - 1].value - regular[0].value;
    return delta - regular.length - wild.length < 0;
  }

  isSet(round: number): boolean {
    if (this.length < 3)
      return false;

    const {regular} = this.split(round);
    if (regular.length < 2)
      return true;

    // No other values
    return !regular.some(card => card.value !== regular[0].value);
  }

  isRunOrSet(round: number): boolean {
    return this.isRun(round) || this.isSet(round);
  }

  score(round: number): number {
    const {regular, wild} = this.split(round);
    let points = 0;
    if (!this.isRunOrSet(round)) {
      regular.forEach(card => {
        if (card) {
          points += card.value
        }
      })
      points += 25 * wild.length;
    }
    return points;
  }
}
