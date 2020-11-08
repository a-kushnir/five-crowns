import _ from 'lodash';
import {Card} from "./card";
import {Deck} from "./deck";

export class Group {
  cards: Card[];
  wilds: number;

  static analyze(deck: Deck, round: number): {regular: Card[], wild: Card[], groups: Group[]} {
    const {regular, wild} = deck.split(round);

    let groups = [];
    regular.forEach(card => {
      this.groups(groups, regular, card, round);
    });
    groups = this.sort(groups);

    return {regular, wild, groups}
  }

  private static push(array: Group[], object: Group): void {
    if (!array.some(obj => _.isEqual(obj, object))) {
      array.push(object);
    }
  }

  private static groups(groups, regular: Card[], card: Card, round: number): void {
    const sameValue = regular.filter(c => c.value == card.value);
    if (sameValue.length > 1) {
      this.push(groups, {
        cards: sameValue,
        wilds: Math.max(3 - sameValue.length, 0)
      })
    }

    const sameSuit = regular.filter(c => c.suit == card.suit);
    const row = Array(11).fill(false);
    sameSuit.forEach(c => row[c.value - 3] = true);

    for(let max = 0; max <= round; max++) {
      for(let i = 0; i < 10; i++) {
        if (row[i]) {
          let cards = [i];
          let wilds = 0;
          for(let j = i + 1; j < 11; j++) {
            if (row[j]) cards.push(j);
            if (!row[j]) wilds++;
            if (wilds > max || j == 10) {
              const k = cards[cards.length - 1];
              if (cards.length > 1 && i <= card.value - 3 && k >= card.value - 3) {
                this.push(groups,{
                  cards: cards.map(value => new Card(value + 3, card.suit)),
                  wilds: Math.max(k - i + 1, 3) - cards.length
                });
              }
              break;
            }
          }
        }
      }
    }
  }

  private static sort(groups: Group[]): Group[] {
    return groups.sort((a, b) => {
      if (a.wilds != b.wilds) {
        return a.wilds > b.wilds ? 1 : -1;
      } else {
        let costA = a.cards.reduce((sum, card) => sum + card.value, 0);
        let costB = b.cards.reduce((sum, card) => sum + card.value, 0);
        return costA < costB ? 1 : -1;
      }
    });
  }
}
