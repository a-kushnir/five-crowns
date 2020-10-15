import {FormGroup} from '@angular/forms';
import {invalid} from '../input-error/input-error.component';
import {Component, HostListener} from '@angular/core';

@Component({
  template: ''
})
export abstract class FormComponent {
  form: FormGroup;
  submitted = false;
  invalid = invalid;

  @HostListener('keydown', ['$event'])
  private _keydown(event): void {
    if (event.key === 'Enter') {
      this.submit();
    }
  }

  submit(): void {
    if (this.submitted) {
      return;
    }

    this.form.markAllAsTouched();
    if (!this.form.valid) {
      return;
    }

    this.submitted = true;
    this.onSubmit();
  }

  abstract onSubmit(): void;
}
