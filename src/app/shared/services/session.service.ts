import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFirestoreCollection} from '@angular/fire/firestore/collection/collection';
import {QueryFn} from '@angular/fire/firestore/interfaces';
import {RealTimeUpdate} from '../real-time-update';
import {Session, SessionStates} from "../models/session.model";
import {Player} from "../models/player.model";
import {UserService} from "./user.service";
import {prepareForUpdate} from "src/app/shared/firebase";
import {Bot} from "../game/bot";

export class SessionKey {
  sessionId: string;
  playerId: number;

  static serialize(value: SessionKey): string {
    return value ? `${value.sessionId}:${value.playerId}` : null;
  }
  static deserialize(value: string): SessionKey {
    if (value) {
      const values = value.split(':');
      return {sessionId: values[0], playerId: Number(values[1])} as SessionKey;
    } else {
      return null;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  sessionKey: BehaviorSubject<SessionKey>;
  session: BehaviorSubject<Session>;
  private rtu: RealTimeUpdate;

  constructor(private firestore: AngularFirestore,
              private userService: UserService) {
    this.rtu = new RealTimeUpdate(this.listenForUpdates.bind(this), this.handleUpdates.bind(this));

    const user = userService.user.value;
    this.sessionKey = new BehaviorSubject<SessionKey>(
      user ? SessionKey.deserialize(user?.session) : null
    );
    this.session = new BehaviorSubject<Session>(null);

    this.sessionKey.subscribe(sessionKey => {
      const user = userService.user.value;
      if (user) {
        userService.update(user.id, {session: SessionKey.serialize(sessionKey)})
          .catch(error => console.log(error));

        this.rtu.subscribe(sessionKey?.sessionId);
        if (!sessionKey) {
          this.session.next(null);
        }
      }
    })
  }

  private collection(queryFn?: QueryFn): AngularFirestoreCollection<any> {
    return this.firestore
      .collection('sessions', queryFn);
  }

  private listenForUpdates(id: string): Observable<any> {
    return this
      .collection()
      .doc(id)
      .valueChanges();
  }

  private handleUpdates(id: string, record: any): void {
    if (record) {
      record = {...record, id};
    }
    this.session.next(record);
  }

  listenForSessions(): Observable<any> {
    return this
      .collection((ref) => ref
        .where('state', '==', SessionStates.Waiting)
        .limit(100)
      )
      .valueChanges({idField: 'id'});
  }

  create(session: Session): Promise<Session> {
    return this
      .collection()
      .add(session)
      .then(record => {
        return {...session, id: record.id};
      });
  }

  update(id: string, data: Partial<Session>): Promise<void> {
    return this
      .collection()
      .doc(id)
      .update(prepareForUpdate(data));
  }

  delete(id: string): Promise<void> {
    return this.collection()
      .doc(id)
      .delete();
  }

  join(sessionId: string, player: Player): Promise<number|null> {
    const ref = this.collection().doc(sessionId).ref;
    const db = this.firestore.firestore;

    return db.runTransaction(function(transaction) {
      return transaction.get(ref).then(function(record) {
        if (!record.exists) {
          throw 'Session not found';
        }

        let playerId = null;
        const session = record.data() as Session;
        if (session.state === SessionStates.Waiting) {
          const playerIds = session.playerIds;
          if (playerIds.length < session.playerMax) {
            playerId = session.playerNextId;
            playerIds.push(playerId);
            const data = {
              playerIds: playerIds,
              [`playerData.${playerId}`]: player,
              playerNextId: playerId + 1
            };
            transaction.update(ref, prepareForUpdate(data));
          }
        }
        return playerId;
      });
    })
  }

  quit(sessionKey: SessionKey): Promise<void> {
    const {sessionId, playerId} = sessionKey;

    if (playerId === 0) {
      return this.delete(sessionId);
    }

    const ref = this.collection().doc(sessionId).ref;
    const db = this.firestore.firestore;

    return db.runTransaction(function(transaction) {
      return transaction.get(ref).then(function(record) {
        if (!record.exists) {
          throw 'Session not found';
        }

        const session = record.data() as Session;
        const playerIds = session.playerIds;
        const index = playerIds.indexOf(playerId);

        if (index > -1) {
          playerIds.splice(index, 1);
          const data = {
            playerIds: playerIds,
            [`playerData.${playerId}`]: null
          };
          transaction.update(ref, prepareForUpdate(data));
        }
      });
    })
  }

  addBot(sessionId: string): Promise<number|null> {
    const names = Object
      .keys(this.session.value.playerData)
      .map(key => this.session.value.playerData[key].name)

    const player = {
      name: Bot.generateName(names),
      bot: true
    } as Player;

    return this.join(sessionId, player);
  }

  removePlayer(sessionId: string, playerId: number): Promise<void> {
    return this.quit({ sessionId, playerId })
  }
}
