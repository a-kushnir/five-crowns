
export enum SessionStates {
  Waiting = 'Waiting',
  Playing = 'Playing',
  Closed = 'Closed',
}

export class Session {
  id?: string;
  state: SessionStates;
  round?: number;
  player?: number;
  maxPlayers: number;
  password?: string;
}
