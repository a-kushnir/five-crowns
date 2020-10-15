import {Injectable, OnDestroy} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RealTimeUpdate implements OnDestroy {
  private key: any;
  private sub: any;
  private readonly onKeyChange: (key: any) => any;
  private readonly onValueChange: (key: any, value: any) => any;

  constructor(onKeyChange: (key: any) => any,
              onValueChange: (key: any, value: any) => any) {
    this.onKeyChange = onKeyChange;
    this.onValueChange = onValueChange;
  }

  subscribe(key: any): void {
    if (this.key !== key) {
      this.unsubscribe();
      if (key !== null && key !== undefined) {
        this.key = key;
        this.sub = this.onKeyChange(key);
        if (this.sub) {
          this.sub = this.sub.subscribe( value => {
            this.onValueChange(key, value);
          });
        }
      }
    }
  }

  unsubscribe(): void {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
      this.key = null;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }
}
