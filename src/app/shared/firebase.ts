import _ from 'lodash';
import * as firebase from 'firebase';
import FieldValue = firebase.firestore.FieldValue;

export function prepareForUpdate(data: object): object {
  data = _.clone(data);
  Object.keys(data).forEach(key => {
    if (!data[key]) {
      data[key] = FieldValue.delete()
    }
  })
  return data;
}
