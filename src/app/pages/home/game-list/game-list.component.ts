import {Component, OnInit} from '@angular/core';
import {Session, SessionStates} from "../../../shared/models/session.model";
import {AutoUnsubscribe} from "../../../shared/auto-unsubscribe";
import {Subscription} from "rxjs";
import {SessionService} from "../../../shared/session.service";
import {UserService} from "../../../shared/user.service";

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
    const user = this.userService.user.value;
    const player = {id: user.id, name: user.name};
    const session = {
      host: player,
      state: SessionStates.Waiting,
      players: [player],
      maxPlayers: 7
    };

    this.sessionService.create(session)
      .then((session) => {
        this.sessionService.session.next(session)
      })
      .catch(error => console.error(error));
  }

  joinGame(session: Session) {
    const user = this.userService.user.value;
    const player = {id: user.id, name: user.name};
    session.players.push(player);
    this.sessionService.update(session).then(() => {
      this.sessionService.session.next(session)
    }).catch(error => console.error(error))
  }
}
