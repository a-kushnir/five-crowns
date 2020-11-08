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

  autoDraw(gameComponent: GameComponent): void {
    if (!this.game.canDraw) return;

    const open = this.game.openCard;
    if (open.isWild(this.game.round)) {
      this.game.drawOpen(0, false);
      gameComponent.update(SaveModes.SessionAndPlayer);
      return;
    }

    const player = this.game.player;
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
    if (!this.game.canDiscard) return;

    const player = this.game.player;
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
      alert('No cards in the first hand');
    }
  }

  newDeck(): Deck {
    const deck = new Deck();
    this.game.player.hands.push(deck);
    return deck;
  }

  moveCards(srcDeck: Deck, dstDeck: Deck, cards: Card[]) {
    srcDeck.moveTo(dstDeck, ...cards);
  }

  moveWildCards(srcDeck: Deck, dstDeck: Deck, cards: Card[], count: number): void {
    count = Math.min(count, cards.length);
    srcDeck.moveTo(dstDeck, ...cards.splice(-count, count));
  }

  autoGroup(): void {
    const player = this.game.player;
    const deck = new Deck();
    deck.add(...player.hands);
    player.hands = [deck];

    let {regular, wild, groups} = Group.analyze(deck, this.game.round);

    while(groups.length > 0) {
      if (groups.length) {
        let g = groups.find(g => g.cards.length === regular.length && g.wilds <= wild.length)
        if (!g) g = groups[0];
        if (g) {
          if (this.game.canDraw ||
             (this.game.canDiscard && this.game.winnerId === undefined && g.cards.length < regular.length) ||
             (this.game.canDiscard && this.game.winnerId !== undefined && g.cards.length < regular.length && g.wilds <= wild.length)) {
            const d = this.newDeck();
            this.moveCards(deck, d, g.cards);
            this.moveWildCards(deck, d, wild, g.wilds);
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
