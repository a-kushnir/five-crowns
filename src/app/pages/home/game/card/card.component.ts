import {Component, Input, OnChanges} from '@angular/core';
import {Card, CardValues} from "src/app/shared/game/card";

@Component({
  selector: 'app-game-card',
  templateUrl: './card.component.html',
  host: {'class': 'game-card'}
})
export class CardComponent implements OnChanges {

  @Input() card: Card;

  image: string;
  text: string;

  constructor() {
  }

  ngOnChanges(): void {
    if (!this.card) {
      this.image = 'cardBack@3x';
      this.text = 'Card Back';
    } else if (this.card.value === CardValues.Joker) {
      this.image = 'Joker';
      this.text = 'Joker';
    } else if (CardValues[this.card.value]) {
      this.image = `${CardValues[this.card.value].charAt(0)}-${this.card.suit}`;
      this.text = `${CardValues[this.card.value]} ${this.card.suit}`;
    } else {
      this.image = `${this.card.value}-${this.card.suit}`;
      this.text = `${this.card.value} ${this.card.suit}`;
    }
  }
}
