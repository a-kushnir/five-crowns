import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {UserService} from 'src/app/shared/user.service';
import {Pages, PageService} from 'src/app/shared/page.service';
import {FormComponent} from 'src/app/shared/components/form/form.component';
import {MyValidators} from 'src/app/shared/validators/my-validators';
import {User} from 'src/app/shared/models/user.model';
import {AutoUnsubscribe} from 'src/app/shared/auto-unsubscribe';

@AutoUnsubscribe
@Component({
  selector: 'app-profile-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent extends FormComponent implements OnInit {

  private $user: Subscription;

  constructor(private userService: UserService,
              private pageService: PageService) {
    super();
  }

  ngOnInit(): void {
    this.$user = this.userService.user.subscribe(this.onUserChange.bind(this));
  }

  onUserChange(user: User): void {
    const emailUnique = MyValidators.uniqueness(this.userService.emailUnique.bind(this.userService));
    if (user) {
      this.form = new FormGroup({
        name: new FormControl(user.name, [Validators.required, Validators.maxLength(50)]),
        email: new FormControl(user.email, [Validators.required, Validators.maxLength(255), Validators.email], emailUnique)
      });
    } else {
      this.form = null;
    }
  }

  onSubmit(): void {
    const {name, email} = this.form.value;
    const user = {...this.userService.user.value, name, email};

    this.userService.update(user).then(_ => {
      this.submitted = false;

      this.userService.user.next(user);
      this.pageService.page.next(Pages.Home);
    }).catch(error => {
      this.submitted = false;
      console.error(error);
    });
  }
}
