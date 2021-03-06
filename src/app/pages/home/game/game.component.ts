import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {faArrowCircleDown, faArrowCircleUp, faCrown, faExclamationTriangle, faUser, faRobot} from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import {Session, SessionStates} from "src/app/shared/models/session.model";
import {UserService} from "src/app/shared/services/user.service";
import {SessionKey, SessionService} from "src/app/shared/services/session.service";
import {Game, SaveModes} from "src/app/shared/game/game";
import {Card} from "src/app/shared/game/card";
import {AudioAssets} from "src/app/shared/audio-assets";
import {Bot} from "src/app/shared/game/bot";

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
  readonly faUser = faUser;
  readonly faRobot = faRobot;

  private $session: Subscription;
  sessionKey: SessionKey;
  session: Session;
  game: Game;
  openCards: Card[];
  bot: Bot;
  waitingForBot: boolean;

  handSortOptions = {
    group: {
      name: 'hands',
      put: ['open', 'deck', 'hands'],
    },
    onMove: (event) => this.onSortMove(event),
    onEnd: (event) => this.onSortEnd(event),
  };

  deckSortOptions = {
    group:
      {
        name: 'deck',
        put: ['hands', 'deck'],
        pull: 'clone',
        revertClone: true,
      },
    onMove: (event) => this.onSortMove(event),
    onEnd: (event) => this.onSortEnd(event),
  };

  openSortOptions = {
    group:
      {
        name: 'open',
        put: ['hands', 'open'],
        pull: 'clone',
        revertClone: true,
      },
    onMove: (event) => this.onSortMove(event),
    onEnd: (event) => this.onSortEnd(event)
  };

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.sessionKey = this.sessionService.sessionKey.value;
    this.session = this.sessionService.session.value;
    this.game = new Game(this.sessionService.sessionKey.value);
    this.game.deserialize(this.session);
    this.bot = new Bot(this.game);
    this.openCards = [this.game.openCard];
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
  }

  onSessionChange(session: Session): void {
    if (!session) {
      this.session = session;
      if (!this.game.isHost) alert('Host left the game');
      return;
    }

    if (this.game.isHost && !session.round) {
      this.deal(1);
    }
    if (this.game.isHost) {
      this.runBot();
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
    this.openCards = [this.game.openCard];
    this.session = session;
  }

  runBot(): void {
    if (!this.game.isHost) return;
    if (this.waitingForBot) return;
    const player = this.game.playerData[this.game.currentId];
    if (!player.bot) return;

    if (this.game.phase === 1) {
      this.waitingForBot = true;
      setTimeout(this.runBotPhase1.bind(this), Math.random() * 1200 + 500);

    } else if (this.game.phase === 2) {
      this.waitingForBot = true;
      setTimeout(this.runBotPhase2.bind(this), Math.random() * 1200 + 500);

    }
  }

  runBotPhase1(): void {
    const player = this.game.playerData[this.game.currentId];
    if (!player.bot) return;
    if (this.game.phase !== 1) return;

    this.bot.autoGroup();
    this.bot.autoDraw(this);
    this.waitingForBot = false;
  }

  runBotPhase2(): void {
    const player = this.game.playerData[this.game.currentId];
    if (!player.bot) return;
    if (this.game.phase !== 2) return;

    this.bot.autoGroup();
    this.bot.autoDiscard(this);
    this.waitingForBot = false;
  }

  onSortMove(event): boolean {
    const src = event.from.dataset.list;
    const dst = event.to.dataset.list;

    if (!isNaN(Number(src)) && !isNaN(Number(dst))) {
      return true;

    } else if (src === 'openCard') {
      return dst === 'openCard' || (!isNaN(Number(dst)) && this.game.playerCanDraw);

    } else if (src === 'deckCard') {
      return dst === 'deckCard' || (!isNaN(Number(dst)) && this.game.playerCanDraw);

    } else if (dst === 'openCard') {
      return dst === 'openCard' || (!isNaN(Number(src)) && this.game.playerCanDiscard);
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
      if (!isNaN(Number(dst)) && this.game.playerCanDraw) {
        this.drawOpen(Number(dst), true);
      }

    } else if (src === 'deckCard') {
      if (!isNaN(Number(dst)) && this.game.playerCanDraw) {
        this.drawDeck(Number(dst), true);
      }

    } else if (dst === 'openCard') {
      if (!isNaN(Number(src)) && this.game.playerCanDiscard) {
        const card = this.openCards.splice(event.newIndex, 1)[0];
        this.game.player.hands[Number(src)].cards.splice(event.oldIndex, 0, card);
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
    if (this.game.playerCanDraw || this.game.botCanDraw) {
      this.game.drawDeck(hand, added);
      this.update(SaveModes.SessionAndPlayer);
      this.playAudio(AudioAssets.CardMoved);
    }
  }

  drawOpen(hand: number = 0, added: boolean = false): void {
    if (this.game.playerCanDraw || this.game.botCanDraw) {
      this.game.drawOpen(hand, added);
      this.update(SaveModes.SessionAndPlayer);
      this.playAudio(AudioAssets.CardMoved);
    }
  }

  discard(hand: number, card: number): void {
    if (this.game.playerCanDiscard || this.game.botCanDiscard) {
      this.game.discard(hand, card);
      this.openCards = [this.game.openCard];
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
