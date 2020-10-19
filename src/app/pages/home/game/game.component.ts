import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {faExclamationTriangle, faCrown} from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import {Session} from "src/app/shared/models/session.model";
import {UserService} from "src/app/shared/user.service";
import {SessionService} from "src/app/shared/session.service";
import {Game} from "src/app/shared/game/game";
import {Card} from "src/app/shared/game/card";

@Component({
  selector: 'app-home-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  readonly faExclamationTriangle = faExclamationTriangle;
  readonly faCrown = faCrown;

  private $session: Subscription;
  session: Session;
  game: Game;

  sortOptions = {
    group: 'hand-group',
    onUpdate: () => this.onSortUpdate(),
  };

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.session = this.sessionService.session.value;
    this.game = new Game(this.userService.user.value.id);
    this.game.deserialize(this.session);
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
  }

  onSessionChange(session: Session): void {
    if (this.game.isHost && !session.round) {
      this.deal(1);
    }

    if (_.isEqual(this.session, session)) {
      return;
    }

    this.session = session;
    if (!session && !this.game.isHost) {
      alert('Host left the game');
    }

    this.game.deserialize(this.session);
  }

  onSortUpdate(): void {
  }

  get openCard(): Card {
    return this.game?.pile?.last;
  }

  deal(round: number): void {
    this.session.phase = 1;
    this.session.current = 0;
    this.session.winner = null;
    this.game.deal(round);
    this.serialize();
    this.update();
  }

  drawDeck(): void {
    if (this.session.current === this.game.playerIdx && this.session.phase === 1) {
      this.game.drawDeck();

      this.session.phase = 2;
      this.serialize();
      this.update();
    }
  }

  drawOpen(): void {
    if (this.session.current === this.game.playerIdx && this.session.phase === 1) {
      this.game.drawOpen();

      this.session.phase = 2;
      this.serialize();
      this.update();
    }
  }

  discard(hand: number, card: number): void {
    if (this.session.current === this.game.playerIdx && this.session.phase === 2) {
      this.game.discard(hand, card);

      if (this.session.winner) {
        this.game.calcScore();
      } else if (this.game.isWinner()) {
        this.session.winner = this.game.playerIdx;
      }

      this.session.phase = 1;
      this.session.current++;
      if (this.session.current >= this.session.players.length) {
        this.session.current = 0;
      }
      if (this.session.winner === this.session.current) {
        this.deal(this.session.round + 1);
      }

      this.serialize();
      this.update();
    }
  }

  serialize(): void {
    if (this.game) {
      this.game.serialize(this.session);
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
