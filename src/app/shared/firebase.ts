import _ from 'lodash';
import * as firebase from 'firebase/app';
import FieldValue = firebase.firestore.FieldValue;

export function prepareForUpdate(data: object): object {
  data = _.clone(data);
  Object.keys(data).forEach(key => {
    if (data[key] === null || data[key] === undefined) {
      data[key] = FieldValue.delete()
    }
  })
  return data;
}
