import {Card} from "./card";
import {Deck} from "./deck";
import {Game, SaveModes} from "./game";
import {GameComponent} from "../../pages/home/game/game.component";
import {Group} from "./group";

export class Bot {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  static generateName(players: string[]): string {
    let names1 = ['Attractive', 'Wise', 'Friendly', 'Rainbow', 'Charming', 'Mature', 'Aristocratic', 'Adorable', 'Proud', 'Romantic', 'Lucky', 'Happy', 'Lazy', 'Mysterious', 'Brave', 'Humble'];
    let names2 = ['Tiger', 'Pony', 'Goose', 'Cat', 'Dog', 'Fox', 'Sheep', 'Puma', 'Panda', 'Parrot', 'Llama', 'Raccoon', 'Duck', 'Kangaroo', 'Ostrich'];
    names1 = names1.filter(name => !players.some(player => player.indexOf(name) >= 0));
    names2 = names2.filter(name => !players.some(player => player.indexOf(name) >= 0));
    const name1 = this.randomItem(names1);
    const name2 = this.randomItem(names2);
    return `${name1} ${name2}`;
  }

  static randomItem(array: any[]): any {
    return array[Math.floor(Math.random() * array.length)];
  }

  autoDraw(gameComponent: GameComponent): void {
    const player = this.game.currentPlayer;
    if (!player.bot) return;
    if (!this.game.botCanDraw) return;

    const open = this.game.openCard;
    if (open.isWild(this.game.round)) {
      this.game.drawOpen(0, false);
      gameComponent.update(SaveModes.SessionAndPlayer);
      return;
    }

    for(let i = 1; i < player.hands.length; i++) {
      const d = new Deck();
      d.add(player.hands[i]);
      d.push(open);
      if (this.game.isRunOrSet(d)) {
        this.game.drawOpen(0, false);
        gameComponent.update(SaveModes.SessionAndPlayer);
        return;
      }
    }
    this.game.drawDeck(0, false);
    gameComponent.update(SaveModes.SessionAndPlayer);
  }

  autoDiscard(gameComponent: GameComponent): void {
    const player = this.game.currentPlayer;
    if (!player.bot) return;
    if (!this.game.botCanDiscard) return;

    if (player.hands[0].cards.length > 0) {
      let max = player.hands[0].cards[0];
      let maxIdx = 0;
      player.hands[0].cards.forEach((card, index) => {
        if (this.game.winnerId === undefined) {
          if (max.isWild(this.game.round) || (!card.isWild(this.game.round) && card.value > max.value)) {
            max = card;
            maxIdx = index;
          }
        } else {
          if (!max.isWild(this.game.round) && (card.isWild(this.game.round) || card.value > max.value)) {
            max = card;
            maxIdx = index;
          }
        }
      })
      gameComponent.discard(0, maxIdx);
    } else {
      const error = `${player.name} autoDiscard: No cards in the first hand`;
      console.error(error);
      throw error;
    }
  }

  private newDeck(): Deck {
    const deck = new Deck();
    this.game.currentPlayer.hands.push(deck);
    return deck;
  }

  private moveCards(srcDeck: Deck, dstDeck: Deck, cards: Card[]) {
    srcDeck.moveTo(dstDeck, ...cards);
  }

  private moveWildCards(srcDeck: Deck, dstDeck: Deck, cards: Card[], count: number): void {
    count = Math.min(count, cards.length);
    srcDeck.moveTo(dstDeck, ...cards.splice(-count, count));
  }

  autoGroup(): void {
    const player = this.game.currentPlayer;
    if (!player.bot) return;

    const deck = new Deck();
    deck.add(...player.hands);
    player.hands = [deck];

    let {regular, wild, groups} = Group.analyze(deck, this.game.round);
    let deck4 = null;

    while(groups.length > 0) {
      if (groups.length) {
        let g = groups.find(g => g.cards.length === regular.length && g.wilds <= wild.length)
        if (!g) g = groups[0];
        if (g) {
          const canSplit4 = deck4 && g.cards.length == regular.length && g.wilds <= wild.length;
          if (this.game.botCanDraw ||
             (this.game.botCanDiscard && this.game.winnerId === undefined && (g.cards.length < regular.length || canSplit4)) ||
             (this.game.botCanDiscard && this.game.winnerId !== undefined && (g.cards.length < regular.length || canSplit4) && g.wilds <= wild.length)) {
            const d = this.newDeck();
            this.moveCards(deck, d, g.cards);
            this.moveWildCards(deck, d, wild, g.wilds);
            if (canSplit4) {
              deck4.moveTo(deck, deck4.cards[0]);
            }
            if (g.cards.length >= 4) {
              deck4 = d;
            }
          } else {
            break;
          }
        }
      }
      ({regular, wild, groups} = Group.analyze(deck, this.game.round))
    }

    if (player.hands.length == 1 && wild.length >= 2) {
      const d = this.newDeck();
      this.moveCards(deck, d, [deck.cards[0]]);
    }
    const d = player.hands[player.hands.length - 1];
    this.moveWildCards(deck, d, wild, wild.length);
  }
}
