import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {LocalStorage} from './local-storage';
import {Title} from '@angular/platform-browser';

export enum Pages {
  Home = 'Home',
  Profile = 'Profile',
  SignIn = 'SignIn',
  SignUp = 'SignUp',
}

@Injectable({
  providedIn: 'root'
})
export class PageService {
  static titles = {SignIn: 'Sign In', SignUp: 'Sign Up'};
  page: BehaviorSubject<Pages>;

  constructor(private titleService: Title) {
    this.page = new BehaviorSubject<Pages>(
      Pages[LocalStorage.getString('page') ?? Pages.SignIn]
    );
    this.page.subscribe(page => {
      LocalStorage.setString('page', page);
      titleService.setTitle(`${PageService.titles[page] ?? page} | Five Crowns`);
    });
  }
}
