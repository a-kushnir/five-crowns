import {Component, Input} from '@angular/core';
import {AbstractControl} from '@angular/forms';

export function invalid(fieldControl: AbstractControl): boolean {
  return fieldControl.invalid && (fieldControl.dirty || fieldControl.touched);
}

@Component({
  selector: 'app-input-error',
  templateUrl: './input-error.component.html',
  styleUrls: ['./input-error.component.scss']
})
export class InputErrorComponent {
  @Input() fieldName: string;
  @Input() fieldControl: AbstractControl;

  constructor() { }

  get fieldError(): string {
    if (!invalid(this.fieldControl)) {
      return null;
    }

    const errors = this.fieldControl.errors;
    if (errors.required) {
      return `${this.fieldName} can't be blank`;
    }
    else if (errors.email) {
      return `${this.fieldName} has invalid format`;
    }
    else if (errors.minlength) {
      const count = errors.minlength.requiredLength;
      return count === 1 ?
        `${this.fieldName} is too short (minimum is 1 character)` :
        `${this.fieldName} is too short (minimum is ${count} characters)`;
    }
    else if (errors.maxlength) {
      const count = errors.maxlength.requiredLength;
      return count === 1 ?
        `${this.fieldName} is too long (maximum is 1 character)` :
        `${this.fieldName} is too long (maximum is ${count} characters)`;
    }
    else if (errors.confirmation) {
      const fieldName = errors.confirmation.fieldName;
      return `${this.fieldName} doesn't match ${fieldName}`;
    }
    else if (errors.uniqueness) {
      return `${this.fieldName} has already been taken`;
    }
    else if (errors.password) {
      return 'The password you entered is incorrect';
    }
    else {
      return `${this.fieldName} is invalid`;
    }
  }
}
