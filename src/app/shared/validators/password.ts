import {AbstractControl, ValidationErrors, Validator} from '@angular/forms';
import {UserService} from '../services/user.service';
import {PasswordService} from '../services/password.service';

export class PasswordValidator implements Validator {
  constructor(private userService: UserService) {
  }

  static create(userService: UserService): (control: AbstractControl) => ValidationErrors|null {
    const validator = new PasswordValidator(userService);
    return validator.validate.bind(validator);
  }

  validate(control: AbstractControl): ValidationErrors|null {
    const value = control.value;
    const user = this.userService.user.value;
    const valid = new PasswordService().compare(value, user.password);
    return valid ? null : {password: true};
  }
}
