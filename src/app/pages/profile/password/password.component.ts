import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {UserService} from 'src/app/shared/user.service';
import {Pages, PageService} from 'src/app/shared/page.service';
import {PasswordService} from 'src/app/shared/password.service';
import {FormComponent} from 'src/app/shared/components/form/form.component';
import {MyValidators} from 'src/app/shared/validators/my-validators';
import {User} from 'src/app/shared/models/user.model';

@Component({
  selector: 'app-profile-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.scss']
})
export class PasswordComponent extends FormComponent implements OnInit {

  private $user: Subscription;

  constructor(private userService: UserService,
              private pageService: PageService) {
    super();
  }

  ngOnInit(): void {
    this.$user = this.userService.user.subscribe(this.onUserChange.bind(this));
  }

  onUserChange(user: User): void {
    if (user) {
      this.form = new FormGroup({
        old_password: new FormControl('', Validators.required),
        password: new FormControl('', [Validators.required, Validators.minLength(8)]),
        confirmation: new FormControl('', [Validators.required, MyValidators.confirmation('password', 'Password')])
      });
    } else {
      this.form = null;
    }
  }

  onSubmit(): void {
    if (!this.validate()) {
      this.submitted = false;
      return;
    }

    let {password} = this.form.value;
    password = new PasswordService().hash(password);
    const user = {...this.userService.user.value, password};

    this.userService.update(user).then(_ => {
      this.submitted = false;

      this.userService.user.next(user);
      this.pageService.page.next(Pages.Home);
    }).catch(error => {
      this.submitted = false;
      console.error(error);
    });
  }

  private validate(): boolean {
    const validator = MyValidators.password(this.userService);
    const field = this.form.controls.old_password;
    field.setErrors(validator(field));
    return this.form.valid;
  }
}
