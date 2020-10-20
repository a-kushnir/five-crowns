import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {UserService} from 'src/app/shared/services/user.service';
import {PageService} from 'src/app/shared/services/page.service';
import {ProfileService} from 'src/app/shared/services/profile.service';
import {FormComponent} from 'src/app/shared/components/form/form.component';
import {User} from 'src/app/shared/models/user.model';
import {AutoUnsubscribe} from 'src/app/shared/auto-unsubscribe';

@AutoUnsubscribe
@Component({
  selector: 'app-profile-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent extends FormComponent implements OnInit {

  private $user: Subscription;

  constructor(private userService: UserService,
              private pageService: PageService,
              private profileService: ProfileService) {
    super();
  }

  ngOnInit(): void {
    this.$user = this.userService.user.subscribe(this.onUserChange.bind(this));
  }

  onUserChange(user: User): void {
    if (user) {
      this.form = new FormGroup({
        syncTheme: new FormControl(user.syncTheme, Validators.required),
        theme: new FormControl(this.profileService.theme, Validators.required)
      });
    } else {
      this.form = null;
    }
  }

  onSubmit(): void {
    const user = this.userService.user.value;
    const {syncTheme, theme} = this.form.value;

    this.userService.update(user.id, {syncTheme, theme})
      .then(() => {
        this.submitted = false;
        this.profileService.theme = theme;
      }).catch(error => {
        this.submitted = false;
        console.error(error);
      });
  }
}
