import {AbstractControl, AsyncValidator, ValidationErrors} from '@angular/forms';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

export class UniquenessValidator implements AsyncValidator {
  constructor(private method: (value: string) => Observable<boolean>) {
  }

  static create(method: (value: string) => Observable<boolean>): (control: AbstractControl) => Observable<ValidationErrors|null> {
    const validator = new UniquenessValidator(method);
    return validator.validate.bind(validator);
  }

  validate(control: AbstractControl): Observable<ValidationErrors|null> {
    const value = control.value;
    return this.method(value)
      .pipe(map(valid => valid ? null : {uniqueness: true}));
  }
}
