import { Component, OnInit } from '@angular/core';
import {Subscription} from "rxjs";
import {Session, SessionStates} from "../../../shared/models/session.model";
import {SessionService} from "../../../shared/session.service";

@Component({
  selector: 'app-home-game-lobby',
  templateUrl: './game-lobby.component.html',
  styleUrls: ['./game-lobby.component.scss']
})
export class GameLobbyComponent implements OnInit {
  $session: Subscription;
  session: Session;
  sessionStates = SessionStates;

  constructor(private sessionService: SessionService) { }

  ngOnInit(): void {
    this.$session = this.sessionService.session.subscribe(this.onSessionChange.bind(this));
  }

  onSessionChange(session: Session): void {
    this.session = session;
  }

  ready() {
  }

  exit() {
    this.sessionService.session.next(null);
  }
}
