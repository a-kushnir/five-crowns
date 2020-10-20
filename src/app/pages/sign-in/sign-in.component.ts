import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {UserService} from 'src/app/shared/user.service';
import {Pages, PageService} from 'src/app/shared/page.service';
import {PasswordService} from 'src/app/shared/password.service';
import {FormComponent} from 'src/app/shared/components/form/form.component';
import {AutoUnsubscribe} from 'src/app/shared/auto-unsubscribe';
import {SessionService} from "../../shared/session.service";

@AutoUnsubscribe
@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent extends FormComponent implements OnInit {
  authError = false;

  private $form: Subscription;

  constructor(private userService: UserService,
              private pageService: PageService,
              private sessionService: SessionService) {
    super();
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });
    this.$form = this.form.statusChanges.subscribe(() => {
      this.authError = false;
    });
  }

  onSubmit(): void {
    const {email, password} = this.form.value;

    this.userService.findByEmail(email).then(user => {
      this.submitted = false;

      if (user && new PasswordService().compare(password, user.password)) {
        this.userService.user.next(user);
        this.pageService.page.next(Pages.Home);
        this.form.reset();
      }
      else {
        this.authError = true;
      }

    }).catch(error => {
      this.submitted = false;
      console.error(error);
    });
  }

  switch(): void {
    this.pageService.page.next(Pages.SignUp);
  }
}
