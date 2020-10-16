import {Component, OnInit} from '@angular/core';
import {Session, SessionStates} from "../../../shared/models/session.model";
import {AutoUnsubscribe} from "../../../shared/auto-unsubscribe";
import {Subscription} from "rxjs";
import {SessionService} from "../../../shared/session.service";

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

  constructor(private sessionService: SessionService) {
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
    const session = {state: SessionStates.Waiting, maxPlayers: 8};
    this.sessionService.create(session)
      .then((session) => {
        this.sessionService.session.next(session)
      })
      .catch(error => console.error(error));
  }

  joinGame(session: Session) {
    this.sessionService.session.next(session)
  }
}
