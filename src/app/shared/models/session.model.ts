import {Player} from "./player.model";

export enum SessionStates {
  Waiting = 'Waiting',
  Playing = 'Playing',
  Closed = 'Closed',
}

export class Session {
  id?: string;
  hostId: string;
  players: Player[];
  state: SessionStates;
  round?: number;
  player?: number;
  maxPlayers: number;
  password?: string;
  deck?: string;
  pile?: string;
}
