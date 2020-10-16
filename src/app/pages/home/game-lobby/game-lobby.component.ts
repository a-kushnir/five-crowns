import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {Session, SessionStates} from "../../../shared/models/session.model";
import {SessionService} from "../../../shared/session.service";
import {UserService} from "../../../shared/user.service";

@Component({
  selector: 'app-home-game-lobby',
  templateUrl: './game-lobby.component.html',
  styleUrls: ['./game-lobby.component.scss']
})
export class GameLobbyComponent implements OnInit {
  $session: Subscription;
  session: Session;
  userId: string;

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
    this.userId = this.userService.user.value.id;
  }

  onSessionChange(session: Session): void {
    const user = this.userService.user.value;
    if (!session && this.session.host.id !== user.id) {
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
    if (this.session.host.id === user.id) {
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
