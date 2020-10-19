import {Deck} from "./deck";

export class Player {
  id: string;
  name: string;
  score: number;
  hands: Deck[];
  scores: number[];
}
