import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import _ from 'lodash';
import {Session} from "src/app/shared/models/session.model";
import {UserService} from "src/app/shared/user.service";
import {SessionService} from "src/app/shared/session.service";
import {Game} from "src/app/shared/game/game";
import {Deck} from "src/app/shared/game/deck";

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

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
    this.session = this.sessionService.session.value;
    this.userId = this.userService.user.value.id;
    this.isHost = this.session.hostId == this.userId;
  }

  onSessionChange(session: Session): void {
    if (_.isEqual(this.session, session)) {
      return;
    }

    this.session = session;
    if (!session && !this.isHost) {
      alert('Host left the game');
    }
    if (this.isHost && !session.round) {
      session.round = 1;
      this.deal();
    }

    this.decode();
  }

  deal(): void {
    this.game = new Game(this.session.round);
    this.game.deal(this.session.players.length);
    this.encode();
    this.update();
  }

  drawDeck(): void {
    this.game.drawDeck(0);
  }

  drawOpen(): void {
    this.game.drawOpen(0);
  }

  discard(index: number): void {
    this.game.discard(0, index);
  }

  encode(): void {
    this.session.deck = Deck.encode(this.game.deck);
    this.session.pile = Deck.encode(this.game.pile);
    for(let i = 0; i < this.game.hands.length; i++) {
      this.session.players[i].hand = Deck.encode(this.game.hands[i]);
    }
  }

  decode(): void {
    this.game.deck = Deck.decode(this.session.deck);
    this.game.pile = Deck.decode(this.session.pile);
    for(let i = 0; i < this.game.hands.length; i++) {
      this.game.hands[i] = Deck.decode(this.session.players[i].hand);
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
