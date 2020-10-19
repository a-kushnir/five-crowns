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
  isHost: boolean;
  ready: boolean;

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
    this.session = this.sessionService.session.value;
    const userId = this.userService.user.value.id;
    this.isHost = this.session.hostId == userId;
  }

  onSessionChange(session: Session): void {
    if (_.isEqual(this.session, session)) {
      return;
    }

    if (session) {
      this.ready = session.players.length > 1;
    }

    if (!session && !this.isHost) {
      alert('Host left the game');
    }
    this.session = session;
  }

  start() {
    this.session.state = SessionStates.Playing;
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
