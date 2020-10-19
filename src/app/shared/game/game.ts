import {Card, CardValues} from "./card";
import {Deck} from "./deck";
import {Player} from "./player";
import {Session} from "../models/session.model";

export class Game {

  readonly playerId: string;

  private hostId: string;
  playerIdx: number = -1;

  round: number;
  deck:  Deck;
  pile:  Deck;
  players: Player[];

  constructor(playerId: string) {
    this.playerId = playerId;
  }

  get isHost(): boolean {
    return this.hostId === this.playerId;
  }

  get player(): Player {
    if (this.playerIdx >= 0) {
      return this.players[this.playerIdx]
    } else {
      throw new Error('Player Not Found')
    }
  }

  get wildCard(): string {
    const value = this.round + 2;
    if (CardValues[value]) {
      return CardValues[value];
    } else {
      return (this.round + 2).toString();
    }
  }

  serialize(session: Session) {
    session.round = this.round;
    session.deck = this.deck.serialize();
    session.pile = this.pile.serialize();
    this.players.forEach(player => {
      const p = session.players.find(p => p.id === player.id);
      if (p) {
        p.score = player.score;
        p.hands = [];
        player.hands.forEach(hand => {
          p.hands.push(hand.serialize());
        });
      }
    });
  }

  deserialize(session: Session) {
    this.hostId = session.hostId;
    this.round = session.round;
    this.deck = Deck.deserialize(session.deck);
    this.pile = Deck.deserialize(session.pile);
    this.playerIdx = session.players.findIndex(p => p.id === this.playerId);

    this.players =
      session.players.map(player => {
        const p = new Player();
        p.id = player.id;
        p.name = player.name;
        p.score = player.score;
        p.hands = [];
        if (player.hands) {
          player.hands.forEach(hand => {
            p.hands.push(Deck.deserialize(hand));
          });
        }
        return p;
      })
  }

  deal(round: number): void {
    Game.validateDeal(round, this.players.length);

    this.round = round;
    this.deck = Deck.create();
    this.deck.shuffle();

    this.players.forEach(player => {
      if (player.score === undefined) {
        player.score = 0;
      }

      player.hands = [];
      const hand = new Deck();
      hand.push(...this.deck.drawCards(this.round + 2));
      player.hands.push(hand);

      for (let i = 0; i < 4; i++) {
        player.hands.push(new Deck());
      }
    });

    this.pile = new Deck();
    this.pile.push(this.deck.drawCard());
  }

  drawOpen(hand: number, added: boolean): void {
    const player = this.player;
    const card = this.pile.drawCard();
    if (!added) {
      player.hands[hand].push(card);
    }
  }

  drawDeck(hand: number, added: boolean): void {
    const player = this.player;
    const card = this.drawCard();
    if (!added) {
      player.hands[hand].push(card);
    } else {
      const idx = player.hands[hand].cards.indexOf(null);
      player.hands[hand].cards[idx] = card;
    }
  }

  discard(handIdx: number, cardIdx: number): void {
    const player = this.player;
    const card = player.hands[handIdx].discard(cardIdx);
    this.pile.push(card);
  }

  isRunOrSet(deck: Deck): boolean {
    return deck.isRunOrSet(this.round);
  }

  isWinner(): boolean {
    const player = this.player;
    return player.hands.every(hand => hand.empty || hand.isRunOrSet(this.round));
  }

  calcScore() {
    const player = this.player;
    player.hands.forEach(hand => {
      player.score += hand.score(this.round);
    })
  }

  private static validateDeal(round: number, players: number): void {
    if (round < 1) {
      throw new Error('Round should be more than 1');
    } else if (round > 11) {
      throw new Error('Round should be less than 11');
    } else if (players <= 1) {
      throw new Error('Player count should be more than 1');
    } else if (players >= 8) {
      throw new Error('Player count should be less than 8');
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
