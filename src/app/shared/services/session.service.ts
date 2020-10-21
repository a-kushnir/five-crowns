import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFirestoreCollection} from '@angular/fire/firestore/collection/collection';
import {QueryFn} from '@angular/fire/firestore/interfaces';
import _ from 'lodash';
import {RealTimeUpdate} from '../real-time-update';
import {Session, SessionStates} from "../models/session.model";
import {Player} from "../models/player.model";
import {UserService} from "./user.service";
import {prepareForUpdate} from "src/app/shared/firebase";

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
  sessions: BehaviorSubject<Session[]>;
  private rtu: RealTimeUpdate;
  private rtu2: RealTimeUpdate;

  constructor(private firestore: AngularFirestore,
              private userService: UserService) {
    this.rtu = new RealTimeUpdate(this.listenForUpdates.bind(this), this.handleUpdates.bind(this));
    this.rtu2 = new RealTimeUpdate(this.listenForUpdates2.bind(this), this.handleUpdates2.bind(this));

    this.sessionKey = new BehaviorSubject<SessionKey>(
      SessionKey.deserialize(userService.user.value.session)
    );
    this.session = new BehaviorSubject<Session>(null);

    this.sessionKey.subscribe(sessionKey => {
      const user = userService.user.value;
      userService.update(user.id, {session: SessionKey.serialize(sessionKey)})
        .catch(error => console.log(error));

      this.rtu.subscribe(sessionKey?.sessionId);
      if (!sessionKey) {
        this.session.next(null);
      }
    })

    this.sessions = new BehaviorSubject<Session[]>([]);
    this.rtu2.subscribe('key');
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

  private listenForUpdates2(): Observable<any> {
    return this
      .collection((ref) => ref
        .where('state', '==', SessionStates.Waiting)
        .limit(100)
      )
      .valueChanges({idField: 'id'});
  }

  private handleUpdates2(key: any, records: any): void {
    if (!_.isEqual(this.sessions.value, records)) {
      this.sessions.next(records);
    }
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

        const session = record.data() as Session;
        const playerIds = session.playerIds;

        let playerId = null;
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
}
