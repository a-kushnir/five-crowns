import {Injectable} from '@angular/core';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class LocalStorage {

  static readonly DateFormat = 'YYYY-MM-DD';

  static getString(key: string): string {
    return localStorage.getItem(key);
  }

  static setString(key: string, value: string): void {
    localStorage.removeItem(key);
    if (value) {
      localStorage.setItem(key, value);
    }
  }

  static getObject(key: string): any {
    const value = this.getString(key);
    return JSON.parse(value);
  }

  static setObject(key: string, value: object): void {
    this.setString(key, JSON.stringify(value));
  }

  static getDate(key: string): moment.Moment {
    const value = this.getString(key);
    return value ? moment(value, this.DateFormat) : null;
  }

  static setDate(key: string, value: moment.Moment): void {
    this.setString(key, value ? value.format(this.DateFormat) : null);
  }

}
