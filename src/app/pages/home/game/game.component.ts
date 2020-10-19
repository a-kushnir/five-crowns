import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {faCrown, faExclamationTriangle, faArrowCircleDown, faArrowCircleUp} from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import {Session, SessionStates} from "src/app/shared/models/session.model";
import {UserService} from "src/app/shared/user.service";
import {SessionService} from "src/app/shared/session.service";
import {Game} from "src/app/shared/game/game";
import {Card} from "src/app/shared/game/card";
import {AudioAssets} from "src/app/shared/audio-assets";

@Component({
  selector: 'app-home-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  readonly faArrowCircleDown = faArrowCircleDown;
  readonly faArrowCircleUp = faArrowCircleUp;
  readonly faExclamationTriangle = faExclamationTriangle;
  readonly faCrown = faCrown;

  private $session: Subscription;
  session: Session;
  game: Game;

  sortOptions = {
    group: {
      name: 'hands',
      put: ['decks', 'hands'],
    },
    onMove: (event) => this.onSortMove(event),
    onEnd: (event) => this.onSortEnd(event),
  };

  sortOptions1 = {
    group:
      {
        name: 'decks',
        pull: 'clone',
        revertClone: true,
      },
    onMove: (event) => this.onSortMove(event),
    onEnd: (event) => this.onSortEnd(event),
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
    if (!session && !this.game.isHost) {
      this.session = session;
      alert('Host left the game');
      return;
    }

    if (this.game.isHost && !session.round) {
      this.deal(1);
    }
    if (_.isEqual(this.session, session)) {
      return;
    }
    if (session && this.session) {
      if (this.session.round !== session.round) {
        this.playAudio(AudioAssets.NextRound);
      } else if (this.session.current !== this.game.playerIdx &&
          session.current === this.game.playerIdx) {
        this.playAudio(AudioAssets.NextTurn);
      }
    }

    this.game.deserialize(session);
    this.session = session;
  }

  onSortMove(event): boolean {
    const src = event.from.dataset.list;
    const dst = event.to.dataset.list;

    if (!isNaN(Number(src)) && !isNaN(Number(dst))) {
      return true;
    } else if (src === 'openCard') {
      if (!isNaN(Number(dst)) && this.session.current === this.game.playerIdx && this.session.phase === 1) {
        return true;
      }
    } else if (src === 'deckCard') {
      if (!isNaN(Number(dst)) && this.session.current === this.game.playerIdx && this.session.phase === 1) {
        return true;
      }
    } else if (dst === 'openCard' || src === 'deckCard') {
      if (!isNaN(Number(src)) && this.session.current === this.game.playerIdx && this.session.phase === 2) {
        return true;
      }
    }

    return false;
  }

  onSortEnd(event): void {
    const src = event.from.dataset.list;
    const dst = event.to.dataset.list;

    if (!isNaN(Number(src)) && !isNaN(Number(dst))) {
      this.playAudio(AudioAssets.CardMoved);
      this.serialize();
      this.update();
    } else if (src === 'openCard') {
      if (!isNaN(Number(dst)) && this.session.current === this.game.playerIdx && this.session.phase === 1) {
        this.drawOpen(Number(dst), true);
      }
    } else if (src === 'deckCard') {
      if (!isNaN(Number(dst)) && this.session.current === this.game.playerIdx && this.session.phase === 1) {
        this.drawDeck(Number(dst), true);
      }
    } else if (dst === 'openCard' || src === 'deckCard') {
      if (!isNaN(Number(src)) && this.session.current === this.game.playerIdx && this.session.phase === 2) {
        this.discard(Number(src), event.oldIndex);
      }
    }
  }

  get openCard(): Card {
    return this.game?.pile?.last;
  }

  deal(round: number): void {
    this.session.phase = 1;
    this.session.current = (round - 1) % this.session.players.length;
    this.session.winner = null;
    this.game.deal(round);
    this.serialize();
    this.update();
  }

  drawDeck(hand: number = 0, added: boolean = false): void {
    if (this.session.current === this.game.playerIdx && this.session.phase === 1) {
      this.game.drawDeck(hand, added);

      this.session.phase = 2;
      this.serialize();
      this.update();
      this.playAudio(AudioAssets.CardMoved);
    }
  }

  drawOpen(hand: number = 0, added: boolean = false): void {
    if (this.session.current === this.game.playerIdx && this.session.phase === 1) {
      this.game.drawOpen(hand, added);

      this.session.phase = 2;
      this.serialize();
      this.update();
      this.playAudio(AudioAssets.CardMoved);
    }
  }

  discard(hand: number, card: number): void {
    if (this.session.current === this.game.playerIdx && this.session.phase === 2) {
      this.game.discard(hand, card);

      if (this.session.winner !== null) {
        this.game.calcScore();
      } else if (this.game.isWinner()) {
        this.session.winner = this.game.playerIdx;
        this.game.player.scores.push(0);
      }

      this.session.phase = 1;
      this.session.current++;
      if (this.session.current >= this.session.players.length) {
        this.session.current = 0;
      }
      if (this.session.winner === this.session.current) {
        if (this.session.round < 11) {
          this.deal(this.session.round + 1);
          this.playAudio(AudioAssets.NextRound);
        } else {
          const scores = this.session.players.map(player => player.score)
          const score = Math.min(...scores);
          this.session.winner = scores.indexOf(score);
          this.session.state = SessionStates.Closed;
        }
      }

      this.serialize();
      this.update();
      this.playAudio(AudioAssets.CardMoved);
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

  playAudio(src: string): void {
    const audio = new Audio();
    audio.src = src;
    audio.load();
    audio.play().then();
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
