import {Injectable} from '@angular/core';
import {UserService} from './user.service';
import {LocalStorage} from './local-storage';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  get theme(): string {
    return LocalStorage.getString('theme') ?? 'light';
  }

  set theme(value) {
    LocalStorage.setString('theme', value);
    setTimeout(location.reload.bind(location), 100);
  }

  constructor(private userService: UserService) {
    userService.user.subscribe(user => {
      if (user && user.syncTheme && user.theme && user.theme !== this.theme) {
        this.theme = user.theme;
      }
    });
  }
}
