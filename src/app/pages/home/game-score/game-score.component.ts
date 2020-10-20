import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import _ from 'lodash';
import {Session} from "src/app/shared/models/session.model";
import {UserService} from "src/app/shared/user.service";
import {SessionService} from "src/app/shared/session.service";
import {faCrown} from '@fortawesome/free-solid-svg-icons';
import {CardValues} from "../../../shared/game/card";

@Component({
  selector: 'app-home-game-score',
  templateUrl: './game-score.component.html',
  styleUrls: ['./game-score.component.scss']
})
export class GameScoreComponent implements OnInit {
  readonly faCrown = faCrown;

  private $session: Subscription;
  session: Session;

  constructor(private userService: UserService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.session = this.sessionService.session.value;
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
  }

  onSessionChange(session: Session): void {
    if (_.isEqual(this.session, session)) {
      return;
    }
    this.session = session;
  }

  wildCard(round: number): string {
    const value = round + 2;
    if (CardValues[value]) {
      return CardValues[value];
    } else {
      return (round + 2).toString();
    }
  }

  quit() {
    this.sessionService.sessionKey.next(null);
  }
}
