import _ from 'lodash';
import {Card, CardValues} from "./card";
import {Deck} from "./deck";
import {Player} from "./player";
import {Player as PlayerModel} from "../models/player.model";
import {Session as SessionModel, SessionStates} from "../models/session.model";
import {SessionKey} from "../services/session.service";

export enum SaveModes {
  SessionOnly,
  PlayerOnly,
  SessionAndPlayer,
  Complete
}

export class Game {
  readonly sessionKey: SessionKey;

  state: SessionStates;
  phase: number;
  current?: number;
  winnerId?: number;
  round: number;
  deck: Deck;
  pile: Deck;
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

  serialize(saveMode: SaveModes): object {
    const session = {} as Partial<SessionModel>;

    if (saveMode !== SaveModes.PlayerOnly) {
      session.state = this.state;
      session.phase = this.phase;
      session.current = this.current;
      session.winnerId = this.winnerId;
      session.round = this.round;
      session.deck = this.deck.serialize();
      session.pile = this.pile.serialize();
    }

    if (saveMode !== SaveModes.SessionOnly) {
      this.playerIds.forEach(playerId => {
        if (saveMode === SaveModes.Complete ||
            playerId === this.sessionKey.playerId) {

          const player = this.playerData[playerId];
          const value = {} as Partial<PlayerModel>;
          value.id = player.id;
          value.name = player.name;
          value.score = player.score;
          value.scores = player.scores;
          value.hands = player.hands.map(hand => hand.serialize()).join(',');
          session[`playerData.${playerId}`] = value;
        }
      });
    }

    return session;
  }

  deserialize(session: SessionModel) {

    this.state = session.state;
    this.phase = session.phase;
    this.current = session.current;
    this.winnerId = session.winnerId;
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
      player.hands = value.hands ? value.hands.split(',').map(hand => Deck.deserialize(hand)) : [];
      this.playerData[key] = player;
    })
  }

  deal(round: number): void {
    Game.validateDeal(round, this.playerIds.length);

    this.phase = 1;
    this.current = (round - 1) % this.playerIds.length;
    this.winnerId = null;
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

  get isCurrent(): boolean {
    return this.current === this.sessionKey.playerId;
  }

  get canDraw(): boolean {
    return this.isCurrent && this.phase === 1;
  }

  get canDiscard(): boolean {
    return this.isCurrent && this.phase === 2;
  }

  drawOpen(hand: number, added: boolean): void {
    const player = this.player;
    const card = this.pile.drawCard();
    this.phase = 2;
    if (!added) {
      player.hands[hand].push(card);
    }
  }

  drawDeck(hand: number, added: boolean): void {
    const player = this.player;
    const card = this.drawCard();
    this.phase = 2;
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

  detectWin() {
    if (this.winnerId !== undefined) {
      this.calcScore();
    } else if (this.isWinner()) {
      this.winnerId = this.sessionKey.playerId;
      this.player.scores.push(0);
    }
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
