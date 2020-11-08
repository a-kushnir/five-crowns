import {Deck} from "./deck";

export class Player {
  id: string;
  name: string;
  bot: boolean;
  score: number;
  hands: Deck[];
  scores: number[];
}
