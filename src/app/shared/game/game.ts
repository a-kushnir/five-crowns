import {Card, CardValues} from "./card";
import {Deck} from "./deck";

export class Game {

  readonly round: number;

  deck:  Deck;
  pile:  Deck;
  hands: Deck[];

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
    this.deck = Deck.create();
    this.deck.shuffle();

    this.hands = [];
    for(let player = 0; player < players; player++) {
      const hand = new Deck();
      hand.push(...this.deck.drawCards(this.round + 2));
      this.hands.push(hand);
    }

    this.pile = new Deck();
    this.pile.push(this.deck.drawCard());
  }

  drawOpen(player: number): void {
    this.validatePlayer(player);
    const card = this.pile.drawCard();
    this.hands[player].push(card);
  }

  drawDeck(player: number): void {
    this.validatePlayer(player);
    const card = this.drawCard();
    this.hands[player].push(card);
  }

  discard(player: number, index: number): void {
    this.validatePlayer(player);
    const hand = this.hands[player];
    const card = hand.discard(index);
    this.pile.push(card);
  }

  private static validateDeal(players: number): void {
    if (players < 1) { // if (players <= 1) {
      throw new Error('Player count should be more than 1');
    } else if (players >= 8) {
      throw new Error('Player count should be less than 8');
    }
  }

  private validatePlayer(player: number) {
    if (player < 0 || player >= this.hands.length) {
      throw new Error('Invalid player index');
    }
  }

  private drawCard(): Card {
    let card = this.deck.drawCard();
    if (!card) {
      const cards = this.pile.drawCards(this.pile.length - 2);
      this.deck.push(...cards);
      this.deck.shuffle();
      card = this.deck.drawCard();
    }
    if (!card) {
      throw new Error("Can't draw a card from deck");
    }
    return card;
  }
}
