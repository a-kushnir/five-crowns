import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';
import {LocalStorage} from './local-storage';
import {AngularFirestore} from '@angular/fire/firestore';
import {RealTimeUpdate} from './real-time-update';
import {QueryFn} from '@angular/fire/firestore/interfaces';
import {AngularFirestoreCollection} from '@angular/fire/firestore/collection/collection';
import {Session, SessionStates} from "./models/session.model";
import _ from 'lodash';
import {UserService} from "./user.service";

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  session: BehaviorSubject<Session>;
  sessions: BehaviorSubject<Session[]>;
  private rtu: RealTimeUpdate;
  private rtu2: RealTimeUpdate;

  constructor(private firestore: AngularFirestore,
              private userService: UserService) {
    this.rtu = new RealTimeUpdate(this.listenForUpdates.bind(this), this.handleUpdates.bind(this));
    this.rtu2 = new RealTimeUpdate(this.listenForUpdates2.bind(this), this.handleUpdates2.bind(this));

    this.session = new BehaviorSubject<Session>(
      LocalStorage.getObject('session')
    );

    this.session.subscribe(session => {
      LocalStorage.setObject('session', session);
      this.rtu.subscribe(session?.id);
      const user = userService.user.value;

      if (user.session != session?.id) {
        if (session) {
          user.session = session?.id;
        } else {
          delete user.session;
        }
        userService.update(user)
          .catch(error => console.error(error));
      }
    });

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

  findAll(): Promise<Session> {
    return this
      .collection(ref => ref
        .where('state', '==', SessionStates.Waiting)
        .limit(1))
      .get()
      .pipe(map(records => {
        if (records.size > 0) {
          const record = records.docs[0];
          return {...record.data(), id: record.id} as Session;
        }
        return null;
      }))
      .toPromise();
  }

  findById(id: string): Promise<Session> {
    return this
      .collection()
      .doc(id)
      .get()
      .pipe(map(record => {
        if (record.exists) {
          return {...record.data(), id: record.id} as Session;
        }
        return null;
      }))
      .toPromise();
  }

  create(session: Session): Promise<Session> {
    return this
      .collection()
      .add(session)
      .then(record => {
        return {...session, id: record.id};
      });
  }

  update(session: Session): Promise<void> {
    const {id, ...record} = session;
    return this
      .collection()
      .doc(id)
      .update(record);
  }

  delete(session: Session): Promise<void> {
    return this.collection()
      .doc(session.id)
      .delete();
  }
}
