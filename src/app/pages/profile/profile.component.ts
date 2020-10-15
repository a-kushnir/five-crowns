import {Component, OnDestroy, OnInit} from '@angular/core';
import {LocalStorage} from '../../shared/local-storage';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  card: string;
  private state: string;

  constructor() {
    this.card = LocalStorage.getString('profile-card') ?? 'account';
    this.state = this.card;
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    LocalStorage.setString('profile-card', null);
  }

  toggle(card: string): void {
    if (this.state === card) {
      this.state = '';
    } else {
      this.state = card;
    }
    LocalStorage.setString('profile-card', this.state);
  }
}
