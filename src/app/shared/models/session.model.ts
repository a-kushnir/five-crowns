
export enum SessionStates {
  Waiting = 'Waiting',
  Playing = 'Playing',
  Closed = 'Closed',
}

export class Player {
  id: string;
  name: string;
}

export class Session {
  id?: string;
  host: Player;
  players: Player[];
  state: SessionStates;
  round?: number;
  player?: number;
  maxPlayers: number;
  password?: string;
}
