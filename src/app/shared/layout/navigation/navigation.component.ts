import {Component, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {Pages, PageService} from '../../services/page.service';
import {User} from '../../models/user.model';

@Component({
  selector: 'app-layout-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  user: User;
  page: Pages;
  pages = Pages;

  constructor(private userService: UserService,
              private pageService: PageService) {
  }

  ngOnInit(): void {
    this.userService.user.subscribe(user => {
      this.user = user;
    });
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

  signOut(): void {
    this.userService.user.next(null);
    this.open(Pages.SignIn);
  }
}
