import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import _ from 'lodash';
import {Session, SessionStates} from "src/app/shared/models/session.model";
import {SessionService} from "src/app/shared/session.service";
import {UserService} from "src/app/shared/user.service";

@Component({
  selector: 'app-home-game-lobby',
  templateUrl: './game-lobby.component.html',
  styleUrls: ['./game-lobby.component.scss']
})
export class GameLobbyComponent implements OnInit {

  private $session: Subscription;
  session: Session;
  playerId: number;
  ready: boolean;

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
    this.playerId = this.sessionService.playerId.value;
  }

  onSessionChange(session: Session): void {
    alert(JSON.stringify(session));

    if (_.isEqual(this.session, session)) {
      return;
    }

    if (session) {
      this.ready = session.playerIds.length > 1;
    }

    if (!session && this.playerId !== 0) {
      alert('Host left the game');
    }
    this.session = session;
  }

  start() {
    this.session.state = SessionStates.Playing;
    this.sessionService.update(this.session)
      .catch(error => console.error(error));
  }

  quit() {
    this.sessionService
      .quit(this.session.id, this.sessionService.playerId.value)
      .then(() => {
        this.sessionService.session.next(null)
        this.sessionService.playerId.next(null);
      }).catch(error => console.error(error));
  }
}
