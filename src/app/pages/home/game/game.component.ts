import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import _ from 'lodash';
import {Session} from "src/app/shared/models/session.model";
import {UserService} from "src/app/shared/user.service";
import {SessionService} from "src/app/shared/session.service";
import {Game} from "src/app/shared/game/game";
import {Deck} from "src/app/shared/game/deck";
import {Card} from "../../../shared/game/card";

@Component({
  selector: 'app-home-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  private $session: Subscription;
  private userId: string;
  session: Session;
  isHost: boolean;
  game: Game;
  playerIndex: number;

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
    this.session = this.sessionService.session.value;
    this.userId = this.userService.user.value.id;
    this.isHost = this.session.hostId == this.userId;
    this.playerIndex = this.session.players.findIndex(player => player.id === this.userId);
    this.decode();
  }

  onSessionChange(session: Session): void {
    if (this.isHost && !session.round) {
      this.deal(1);
    }

    if (_.isEqual(this.session, session)) {
      return;
    }

    this.session = session;
    if (!session && !this.isHost) {
      alert('Host left the game');
    }

    this.decode();
  }

  get openCard(): Card {
    return this.game?.pile?.last;
  }

  deal(round: number): void {
    this.session.round = round;
    this.session.phase = 1;
    this.session.current = 0;
    this.session.winner = null;

    this.game = new Game(this.session.round);
    this.game.deal(this.session.players.length);
    this.encode();
    this.update();
  }

  drawDeck(): void {
    if (this.session.current === this.playerIndex && this.session.phase === 1) {
      this.game.drawDeck(this.playerIndex);

      this.session.phase = 2;
      this.encode();
      this.update();
    }
  }

  drawOpen(): void {
    if (this.session.current === this.playerIndex && this.session.phase === 1) {
      this.game.drawOpen(this.playerIndex);

      this.session.phase = 2;
      this.encode();
      this.update();
    }
  }

  discard(index: number): void {
    if (this.session.current === this.playerIndex && this.session.phase === 2) {
      this.game.discard(this.playerIndex, index);

      this.session.phase = 1;
      this.session.current++;
      if (this.session.current >= this.session.players.length) {
        this.session.current = 0;
      }
      this.encode();
      this.update();
    }
  }

  encode(): void {
    const game = this.game;
    if (game) {
      this.session.deck = Deck.encode(game.deck);
      this.session.pile = Deck.encode(game.pile);
      for(let i = 0; i < game.hands.length; i++) {
        this.session.players[i].hand = Deck.encode(game.hands[i]);
      }
    }
  }

  decode(): void {
    const session = this.session;
    if (session.deck) {
      this.game = new Game(session.round);
      this.game.deck = Deck.decode(session.deck);
      this.game.pile = Deck.decode(session.pile);
      this.game.hands = [];
      for(let i = 0; i < session.players.length; i++) {
        this.game.hands[i] = Deck.decode(session.players[i].hand);
      }
    }
  }

  update(): void {
    this.sessionService.update(this.session)
      .catch(error => console.error(error));
  }

  exit() {
    const user = this.userService.user.value;
    if (this.session.hostId === user.id) {
      this.sessionService.delete(this.session)
        .then(() => this.sessionService.session.next(null))
        .catch(error => console.error(error));
    } else {
      this.session.players =
        this.session.players.filter(player => player.id !== user.id);
      this.sessionService.update(this.session)
        .then(() => {
          this.$session.unsubscribe();
          this.sessionService.session.next(null);
        })
        .catch(error => console.error(error));
    }
  }
}
