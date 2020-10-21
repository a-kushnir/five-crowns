import {Player} from "./player.model";

export enum SessionStates {
  Waiting = 'Waiting',
  Playing = 'Playing',
  Closed = 'Closed',
}

export class Session {
  id?: string;
  playerIds: number[];
  playerData: object;
  playerNextId: number;
  playerMax: number;
  password?: string;
  state: SessionStates;
  round?: number;
  phase?: number;
  current?: number;
  winner?: number;
  deck?: string;
  pile?: string;
}
