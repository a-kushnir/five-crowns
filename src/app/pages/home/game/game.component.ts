import { Component, OnInit } from '@angular/core';
import {Subscription} from "rxjs";
import {Session} from "../../../shared/models/session.model";
import {UserService} from "../../../shared/user.service";
import {SessionService} from "../../../shared/session.service";

@Component({
  selector: 'app-home-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
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
