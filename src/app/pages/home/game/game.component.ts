import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {Session} from "src/app/shared/models/session.model";
import {UserService} from "src/app/shared/user.service";
import {SessionService} from "src/app/shared/session.service";
import {Game} from "src/app/shared/game/game";

@Component({
  selector: 'app-home-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  $session: Subscription;
  session: Session;
  userId: string;
  game: Game;

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
    this.userId = this.userService.user.value.id;
    this.game = new Game(1);
    this.game.deal(4);
  }

  onSessionChange(session: Session): void {
    const user = this.userService.user.value;
    if (!session && this.session.host.id !== user.id) {
      alert('Host left the game');
    }
    this.session = session;
  }

  drawDeck(): void {
    this.game.drawDeck(0);
  }

  drawOpen(): void {
    this.game.drawOpen(0);
  }

  discard(index: number): void {
    this.game.discard(0, index);
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
