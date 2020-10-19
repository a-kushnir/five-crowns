import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import _ from 'lodash';
import {Session} from "src/app/shared/models/session.model";
import {UserService} from "src/app/shared/user.service";
import {SessionService} from "src/app/shared/session.service";
import {Game} from "src/app/shared/game/game";
import {Card} from "src/app/shared/game/card";
import {Player} from "src/app/shared/models/player.model";
import {faGamepad, faCrown} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  readonly faGamepad = faGamepad;
  readonly faCrown = faCrown;

  private $session: Subscription;
  private userId: string;
  session: Session;
  isHost: boolean;
  game: Game;
  playerIndex: number;

  sortOptions = {
    filter: 'input',
    preventOnFilter: false,
    onUpdate: () => this.onSortUpdate(),
  };

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
    this.session = this.sessionService.session.value;
    this.userId = this.userService.user.value.id;
    this.isHost = this.session.hostId == this.userId;
    this.playerIndex = this.session.players.findIndex(player => player.id === this.userId);
    this.deserialize();
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

    this.deserialize();
  }

  onSortUpdate(): void {
  }

  get openCard(): Card {
    return this.game?.pile?.last;
  }

  get player(): Player {
    return this.session.players[this.playerIndex];
  }

  deal(round: number): void {
    this.session.round = round;
    this.session.phase = 1;
    this.session.current = 0;
    this.session.winner = null;
    if (round === 1) {
      this.session.players.forEach(player => player.score = 0);
    }

    this.deserialize();
    this.game.deal();
    this.serialize();
    this.update();
  }

  drawDeck(): void {
    if (this.session.current === this.playerIndex && this.session.phase === 1) {
      this.game.drawDeck(this.playerIndex);

      this.session.phase = 2;
      this.serialize();
      this.update();
    }
  }

  drawOpen(): void {
    if (this.session.current === this.playerIndex && this.session.phase === 1) {
      this.game.drawOpen(this.playerIndex);

      this.session.phase = 2;
      this.serialize();
      this.update();
    }
  }

  isSetOrRun(hand: number): boolean {
    return this.game.isRunOrSet(this.game.players[this.playerIndex].hands[hand].cards);
  }

  discard(hand: number, card: number): void {
    if (this.session.current === this.playerIndex && this.session.phase === 2) {
      this.game.discard(this.playerIndex, hand, card);

      if (this.isSetOrRun(hand)) { // TODO check all hands!
        if (!this.session.winner) {
          this.session.winner = this.playerIndex;
        }
      } else {
        if (this.session.winner) {
          this.game.players[this.playerIndex].hands.forEach(hand => {
            if (!this.game.isRunOrSet(hand.cards)) {
              this.player.score += this.game.score(hand.cards);
            }
          })
        }
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
      Game.serialize(this.game, this.session);
    }
  }

  deserialize(): void {
    if (!this.game) {
      this.game = new Game();
    }
    Game.deserialize(this.game, this.session);
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
