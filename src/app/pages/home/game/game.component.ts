import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {faArrowCircleDown, faArrowCircleUp, faCrown, faExclamationTriangle} from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import {Session, SessionStates} from "src/app/shared/models/session.model";
import {UserService} from "src/app/shared/services/user.service";
import {SessionKey, SessionService} from "src/app/shared/services/session.service";
import {Game, SaveModes} from "src/app/shared/game/game";
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
  sessionKey: SessionKey;
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
    this.sessionKey = this.sessionService.sessionKey.value;
    this.session = this.sessionService.session.value;
    this.game = new Game(this.sessionService.sessionKey.value);
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

      } else if (this.session.currentId !== this.game.sessionKey.playerId &&
          session.currentId === this.game.sessionKey.playerId) {
          this.playAudio(session.winnerId !== undefined ?
            AudioAssets.LastTurn : AudioAssets.NextTurn);
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
      if (!isNaN(Number(dst)) && this.game.canDraw) {
        return true;
      }
    } else if (src === 'deckCard') {
      if (!isNaN(Number(dst)) && this.game.canDraw) {
        return true;
      }
    } else if (dst === 'openCard' || src === 'deckCard') { // TODO?
      if (!isNaN(Number(src)) && this.game.canDiscard) {
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
      this.update(SaveModes.PlayerOnly);
    } else if (src === 'openCard') {
      if (!isNaN(Number(dst)) && this.game.canDraw) {
        this.drawOpen(Number(dst), true);
      }
    } else if (src === 'deckCard') {
      if (!isNaN(Number(dst)) && this.game.canDraw) {
        this.drawDeck(Number(dst), true);
      }
    } else if (dst === 'openCard' || src === 'deckCard') { // TODO?
      if (!isNaN(Number(src)) && this.game.canDiscard) {
        this.discard(Number(src), event.oldIndex);
      }
    }
  }

  get openCard(): Card {
    return this.game?.pile?.last;
  }

  deal(round: number): void {
    this.game.deal(round);
    this.update(SaveModes.Complete);
  }

  drawDeck(hand: number = 0, added: boolean = false): void {
    if (this.game.canDraw) {
      this.game.drawDeck(hand, added);
      this.update(SaveModes.SessionAndPlayer);
      this.playAudio(AudioAssets.CardMoved);
    }
  }

  drawOpen(hand: number = 0, added: boolean = false): void {
    if (this.game.canDraw) {
      this.game.drawOpen(hand, added);
      this.update(SaveModes.SessionAndPlayer);
      this.playAudio(AudioAssets.CardMoved);
    }
  }

  discard(hand: number, card: number): void {
    if (this.game.canDiscard) {
      this.game.discard(hand, card);
      this.game.detectRoundWinner();
      this.game.nextCurrentId();

      let dealt = false;
      if (this.game.winnerId === this.game.currentId) {
        if (this.game.round < 11) {
          this.deal(this.game.round + 1);
          dealt = true;
          this.playAudio(AudioAssets.NextRound);
        } else {
          this.game.detectGameWinner();
          this.game.state = SessionStates.Closed;
        }
      }

      this.update(dealt ? SaveModes.Complete : SaveModes.SessionAndPlayer);
      this.playAudio(AudioAssets.CardMoved);
    }
  }

  update(saveMode: SaveModes): void {
    const data = this.game.serialize(saveMode);
    this.sessionService.update(this.game.sessionKey.sessionId, data)
      .catch(error => console.error(error));
  }

  playAudio(src: string): void {
    const audio = new Audio();
    audio.src = src;
    audio.load();
    audio.play().then();
  }
}
