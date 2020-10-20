import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {Session, SessionStates} from "src/app/shared/models/session.model";
import {AutoUnsubscribe} from "src/app/shared/auto-unsubscribe";
import {SessionService} from "src/app/shared/session.service";
import {UserService} from "src/app/shared/user.service";

@AutoUnsubscribe
@Component({
  selector: 'app-home-game-list',
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.scss']
})
export class GameListComponent implements OnInit {
  sessions: Session[] = [];
  $sessions: Subscription
  selected: Session;
  submitted: boolean = false;

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.$sessions = this.sessionService.sessions.subscribe(this.onSessionsChange.bind(this));
  }

  onSessionsChange(sessions: Session[]): void {
    this.sessions = sessions;
    if (this.selected && !sessions.some(session => session.id === this.selected.id)) {
      this.selected = null;
    }
  }

  select(session): void {
    if (this.selected?.id === session.id) {
      this.selected = null;
    } else {
      this.selected = session;
    }
  }

  hostGame(): void {
    if (this.submitted) return;
    this.submitted = true;

    const user = this.userService.user.value;
    const player = {
      id: user.id,
      name: user.name
    };
    const session = {
      hostId: user.id,
      state: SessionStates.Waiting,
      playerIds: [0],
      playerData: {0: player},
      playerNextId: 1,
      playerMax: 7
    } as Session;

    this.sessionService.create(session)
      .then(session => {
        this.sessionService.session.next(session)
        this.sessionService.playerId.next(0);
        this.submitted = false;
      })
      .catch(error => console.error(error));
  }

  joinGame(sessionId: string) {
    if (this.submitted) return;
    this.submitted = true;

    const user = this.userService.user.value;
    const player = {
      id: user.id,
      name: user.name
    };
    this.sessionService.join(sessionId, player)
      .then(result => {
        const {session, playerId} = result;
        if (playerId) {
          this.sessionService.session.next(session)
          this.sessionService.playerId.next(playerId);
        } else {
          alert('Failed to join the game');
        }
        this.submitted = false;
      })
      .catch(error => console.error(error));
  }
}
