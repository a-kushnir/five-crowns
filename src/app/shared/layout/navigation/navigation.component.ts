import {Component, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {Pages, PageService} from '../../services/page.service';
import {User} from '../../models/user.model';
import {SessionKey, SessionService} from "../../services/session.service";

@Component({
  selector: 'app-layout-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  user: User;
  sessionKey: SessionKey;
  page: Pages;
  pages = Pages;

  constructor(private userService: UserService,
              private sessionService: SessionService,
              private pageService: PageService) {
  }

  ngOnInit(): void {
    this.userService.user.subscribe(user => {
      this.user = user;
    });
    this.sessionService.sessionKey.subscribe(sessionKey => {
      this.sessionKey = sessionKey;
    })
    this.pageService.page.subscribe(page => {
      this.page = page;
      if (!this.user && (this.page !== Pages.SignIn && this.page !== Pages.SignUp)) {
        this.pageService.page.next(Pages.SignIn);
      }
    });
  }

  open(page: Pages): void {
    this.pageService.page.next(page);
  }

  quitGame() {
    this.sessionService
      .quit(this.sessionKey)
      .then(() => {
        this.sessionService.sessionKey.next(null)
      }).catch(error => console.error(error));
  }

  signOut(): void {
    this.userService.user.next(null);
    this.open(Pages.SignIn);
  }
}
