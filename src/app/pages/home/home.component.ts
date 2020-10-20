import {Component, OnInit} from '@angular/core';
import {Session, SessionStates} from "../../shared/models/session.model";
import {SessionService} from "src/app/shared/services/session.service";
import {AutoUnsubscribe} from "src/app/shared/auto-unsubscribe";
import {Subscription} from "rxjs";

@AutoUnsubscribe
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
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
}
