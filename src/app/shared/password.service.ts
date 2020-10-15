import { Injectable } from '@angular/core';
import { Md5 } from 'ts-md5/dist/md5';

@Injectable({
  providedIn: 'root'
})
export class PasswordService {
  readonly md5 = new Md5();

  hash(webValue: string): string {
    return btoa(String(this.md5.appendStr(webValue).end()));
  }

  compare(webValue: string, dbValue: string): boolean {
    return this.hash(webValue) === dbValue;
  }
}
