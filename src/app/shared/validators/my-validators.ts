import {ConfirmationValidator} from './confirmation';
import {UniquenessValidator} from './uniqueness';
import {PasswordValidator} from './password';

export class MyValidators {
  static confirmation = ConfirmationValidator.create;
  static uniqueness = UniquenessValidator.create;
  static password = PasswordValidator.create;
}
