import {Card, CardSuits} from "./card";
import {Deck} from "./deck";
import {Game} from "./game";
import {GameComponent} from "../../pages/home/game/game.component";

export class Bot {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  analyze(deck): {matrix: number[][], sets: number[], wilds: Card[]} {
    const suits = Object.keys(CardSuits);
    const matrix = suits.map(_ => new Array(11).fill(0));
    const {regular, wilds} = deck.split(this.game.round);
    const sets = new Array(11).fill(0);
    regular.forEach(card => {
      sets[card.value - 3] += 1;
      matrix[suits.indexOf(card.suit)][card.value - 3] += 1;
    });
    return {matrix, sets, wilds};
  }

  findRun(matrix: number[][]) {
    const suits = Object.keys(CardSuits);
    for(let index = 0; index < suits.length; index ++) {
      const suit = matrix[index];
      for(let i = 0; i < suit.length - 2; i++) {
        if (suit[i] > 0 && suit[i+1] > 0 && suit[i+2] > 0) {
          return {suit: suits[index], index: i, length: 3};
        }
      }
    }
    return null;
  }

  autoDraw(): void {
    if (!this.game.canDraw) return;

    const open = this.game.openCard;
    if (open.isWild(this.game.round)) {
      this.game.drawOpen(0, false);
      return;
    }

    const player = this.game.player;
    for(let i = 1; i < player.hands.length; i++) {
      const d = new Deck();
      d.add(player.hands[i]);
      d.push(open);
      if (this.game.isRunOrSet(d)) {
        this.game.drawOpen(0, false);
        return;
      }
    }
    this.game.drawDeck(0, false);
  }

  autoDiscard(gameComponent: GameComponent): void {
    if (!this.game.canDiscard) return;

    const player = this.game.player;
    if (player.hands[0].cards.length > 0) {
      let max = player.hands[0].cards[0];
      let maxIdx = 0;
      player.hands[0].cards.forEach((card, index) => {
        if (card.value > max.value) {
          max = card;
          maxIdx = index;
        }
      })
      gameComponent.discard(0, maxIdx);
    } else {
      alert('No cards in the first hand');
    }
  }

  autoGroup(): void {
    const player = this.game.player;
    const deck = new Deck();
    deck.add(...player.hands);

    let {matrix, sets, wilds} = this.analyze(deck);
    player.hands = [deck];

    const run = this.findRun(matrix);
    if (run) {
      const {suit, index, length} = run;
      if (length >= 3) {
        let d = new Deck();
        player.hands.push(d);

        for(let i = index; i < index + length; i++) {
          const c = deck.cards.find(card => card.value == i + 3 && card.suit == suit);
          deck.moveTo(d, c);
        }
      }
    }

    ({matrix, sets, wilds} = this.analyze(deck));

    sets.forEach((set, index) => {
      if (set > 1) {
        let d = new Deck();
        player.hands.push(d);

        let c = deck.cards.find(card => card.value == index + 3);
        while(c) {
          deck.moveTo(d, c);
          c = deck.cards.find(card => card.value == index + 3);
        }
      }
    })

    let w = wilds.length;
    for(let i = player.hands.length - 1; i > 0; i--) {
      const x = 3 - player.hands[i].cards.length;
      if (x >= 1 && w > 0) {
        w -= 1;
        deck.moveTo(player.hands[i], wilds[w]);
      }
    }

    const offset = this.game.canDiscard ? 1 : 0;
    const { regular } = player.hands[0].split(this.game.round);

    if (w > 1 && (regular.length - offset) >= 1) {
      let d = new Deck();
      player.hands.push(d);

      let max = regular[0];
      regular.forEach((card, index) => {
        if (card.value > max.value) {
          max = card;
        }
      })

      deck.moveTo(d, max);
      while (w > 0) {
        w -= 1;
        deck.moveTo(d, wilds[w]);
      }

    } else {
      while (w > 0) {
        w -= 1;
        deck.moveTo(player.hands[1], wilds[w]);
      }
    }

    debugger;
  }
}
