import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import _ from 'lodash';
import {Session, SessionStates} from "src/app/shared/models/session.model";
import {SessionKey, SessionService} from "src/app/shared/services/session.service";
import {UserService} from "src/app/shared/services/user.service";

@Component({
  selector: 'app-home-game-lobby',
  templateUrl: './game-lobby.component.html',
  styleUrls: ['./game-lobby.component.scss']
})
export class GameLobbyComponent implements OnInit {

  private $session: Subscription;
  sessionKey: SessionKey;
  session: Session;

  ready: boolean;

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.sessionKey = this.sessionService.sessionKey.value;
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
  }

  onSessionChange(session: Session): void {
    if (_.isEqual(this.session, session)) return;
    this.session = session;

    if (session) {
      this.ready = session.playerIds.length > 1;
    }

    if (!session && this.sessionKey &&
      this.sessionKey.playerId !== 0) {
      alert('Host left the game');
    }
  }

  start() {
    this.sessionService.update(this.session.id, {state: SessionStates.Playing})
      .catch(error => console.error(error));
  }

  quit() {
    this.sessionService
      .quit(this.sessionKey)
      .then(() => {
        this.sessionService.sessionKey.next(null)
      }).catch(error => console.error(error));
  }
}
