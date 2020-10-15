import {Component, OnInit} from '@angular/core';
import {UserService} from './shared/user.service';
import {Pages, PageService} from './shared/page.service';
import {User} from './shared/models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
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
    });
  }
}
