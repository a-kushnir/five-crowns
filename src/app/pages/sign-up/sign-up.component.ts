import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from 'src/app/shared/user.service';
import {PasswordService} from 'src/app/shared/password.service';
import {ProfileService} from 'src/app/shared/profile.service';
import {Pages, PageService} from 'src/app/shared/page.service';
import {User} from 'src/app/shared/models/user.model';
import {FormComponent} from 'src/app/shared/components/form/form.component';
import {MyValidators} from 'src/app/shared/validators/my-validators';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent extends FormComponent implements OnInit {

  constructor(private userService: UserService,
              private pageService: PageService,
              private profileService: ProfileService) {
    super();
  }

  ngOnInit(): void {
    const emailUnique = MyValidators.uniqueness(this.userService.emailUnique.bind(this.userService));
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      email: new FormControl('', [Validators.required, Validators.maxLength(255), Validators.email], emailUnique),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmation: new FormControl('', [Validators.required, MyValidators.confirmation('password', 'Password')])
    });
  }

  onSubmit(): void {
    const {name, email, confirmation} = this.form.value;
    let {password} = this.form.value;

    if (password === confirmation) {
      const theme = this.profileService.theme;
      password = new PasswordService().hash(password);

      this.userService.findByEmail(email).then(existingUser => {
        if (!existingUser) {
          const user: User = {name, email, password, syncTheme: true, theme};
          this.userService.create(user).then(newUser => {
            this.submitted = false;

            this.form.reset();
            this.userService.user.next(newUser);
            this.pageService.page.next(Pages.Home);
          }).catch(error => {
            this.submitted = false;
            console.error(error);
          });
        } else {
          this.submitted = false;
        }
      }).catch(error => {
        this.submitted = false;
        console.error(error);
      });
    }
  }

  switch(): void {
    this.pageService.page.next(Pages.SignIn);
  }
}
