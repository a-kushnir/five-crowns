import {Card, CardSuits, CardValues} from "./models/card.model";

export class Game {

  readonly round: number;

  deck:  Card[];
  open:  Card;
  pile:  Card[];
  hands: Card[][];

  constructor(round: number) {
    if (round < 1) {
      throw new Error('Round should be more than 1');
    } else if (round > 11) {
      throw new Error('Round should be less than 11');
    }
    this.round = round;
  }

  isWild(card: Card): boolean {
    return card.value === CardValues.Joker || this.round + 2 === card.value;
  }

  private split(cards: Card[]): {regular, wilds} {
    const regular = [];
    const wilds = [];
    for(let card of cards) {
      if (this.isWild(card)) {
        wilds.push(card);
      } else {
        regular.push(card);
      }
    }
    return {regular, wilds}
  }

  isRun(cards: Card[]): boolean {
    if (cards.length < 3)
      return false;

    const {regular, wilds} = this.split(cards);
    if (regular.length < 2)
      return true;

    // No other suits
    if (regular.some(card => card.suit !== regular[0].suit))
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
    debugger;
    return delta - regular.length - wilds.length < 0;
  }

  isSet(cards: Card[]): boolean {
    if (cards.length < 3)
      return false;

    const {regular} = this.split(cards);
    if (regular.length < 2)
      return true;

    // No other values
    return !regular.some(card => card.value !== regular[0].value);
  }

  isRunOrSet(cards: Card[]): boolean {
    return this.isRun(cards) || this.isSet(cards);
  }

  calcPoints(cards: Card[]): number {
    const {regular, wilds} = this.split(cards);
    let points = 0;
    regular.forEach(card => points += card.value)
    points += 25 * wilds.length;
    return points;
  }

  deal(players: number): void {
    Game.validateDeal(players);
    this.deck = Game.createDeck();
    Game.shuffle(this.deck);
    this.createHands(players);
  }

  drawOpen(player: number): void {
    this.validatePlayer(player);
    this.hands[player].push(this.open);
    this.open = null;
  }

  drawDeck(player: number): void {
    this.validatePlayer(player);
    this.hands[player].push(this.drawNext());
  }

  discard(player: number, card: Card): void {
    this.validatePlayer(player);
    if (this.hands[player].some(card => card.value == card.value && card.suit == card.suit)) {
      throw new Error("Player doesn't have the card");
    }
    this.hands[player] =
      this.hands[player].filter(card => !(card.value == card.value && card.suit == card.suit));
    this.open = card;
  }

  private static validateDeal(players: number): void {
    if (players <= 1) {
      throw new Error('Player count should be more than 1');
    } else if (players >= 8) {
      throw new Error('Player count should be less than 8');
    }
  }

  validatePlayer(player: number) {
    if (player < 0 || player >= this.hands.length) {
      throw new Error('Invalid player index');
    }
  }

  private static createDeck(): Card[] {
    let deck: Card[] = [];

    const decks = 2;
    for (let count = 1; count <= decks; count++) {
      Object.keys(CardSuits).forEach(suit => {
        for (let value = 3; value <= CardValues.King; value++) {
          deck.push({value, suit: suit})
        }
      });
      for (let count = 1; count <= 3; count++) {
        deck.push({value: CardValues.Joker})
      }
    }

    return deck;
  }

  // Fisher-Yates (aka Knuth) Shuffle
  private static shuffle(array: any[]): void {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  }

  private drawNext(): Card {
    if (this.deck.length === 0) {
      this.deck = this.pile;
      this.pile = [];
      Game.shuffle(this.deck);
    }
    return this.deck.splice(0,1)[0];
  }

  private createHands(players: number): void {
    this.hands = [];
    for(let player = 0; player < players; player++) {
      this.hands.push([]);
    }
    for(let i = -2; i < this.round; i++) {
      for(let player = 0; player < players; player++) {
        this.hands[player].push(this.drawNext());
      }
    }
    this.open = this.drawNext();
    this.pile = [];
  }
}
