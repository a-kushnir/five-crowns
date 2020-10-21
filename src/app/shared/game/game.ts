import _ from 'lodash';
import {Card, CardValues} from "./card";
import {Deck} from "./deck";
import {Player} from "./player";
import {Session} from "../models/session.model";
import {SessionKey} from "../services/session.service";

export class Game {
  readonly sessionKey: SessionKey;

  phase: number;
  current: number;
  winner: number;
  round: number;
  deck:  Deck;
  pile:  Deck;
  playerIds: number[];
  playerData: object;

  constructor(sessionKey: SessionKey) {
    this.sessionKey = _.clone(sessionKey);
  }

  get isHost(): boolean {
    return this.sessionKey.playerId === 0;
  }

  get player(): Player {
    return this.playerData[this.sessionKey.playerId]
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
    /* TODO this.players.forEach(player => {
      const p = session.players.find(p => p.id === player.id);
      if (p) {
        p.score = player.score;
        p.scores = player.scores;
        p.hands = [];
        player.hands.forEach(hand => {
          p.hands.push(hand.serialize());
        });
      }
    });*/
  }

  deserialize(session: Session) {
    this.round = session.round;
    this.deck = Deck.deserialize(session.deck);
    this.pile = Deck.deserialize(session.pile);
    this.playerIds = session.playerIds;

    this.playerData = {};
    Object.keys(session.playerData).map(key => {
      const value = session.playerData[key];
      const player = new Player();

      player.id = value.id;
      player.name = value.name;
      player.score = value.score;
      player.scores = value.scores;
      player.hands = [];
      if (value.hands) {
        value.hands.forEach(hand => {
          player.hands.push(Deck.deserialize(hand));
        });
      }
      this.playerData[key] = player;
    })
  }

  deal(round: number): void {
    Game.validateDeal(round, this.playerIds.length);

    this.phase = 1;
    this.current = (round - 1) % this.playerIds.length;
    this.winner = null;
    this.round = round;
    this.deck = Deck.create();
    this.deck.shuffle();

    Object.keys(this.playerData).map(key => {
      const player = this.playerData[key];

      if (player.score === undefined) {
        player.score = 0;
        player.scores = [];
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
    let score = 0;
    player.hands.forEach(hand => {
      score += hand.score(this.round);
    })
    player.score += score;
    player.scores.push(score);
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
