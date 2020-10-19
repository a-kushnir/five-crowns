import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {AngularFireDatabaseModule} from "@angular/fire/database";
import {AngularFireModule} from "@angular/fire";
import {environment} from "../environments/environment";

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HeaderComponent} from "./shared/layout/header/header.component";
import {NavigationComponent} from "./shared/layout/navigation/navigation.component";
import {FooterComponent} from "./shared/layout/footer/footer.component";
import {InputErrorComponent} from "./shared/components/input-error/input-error.component";

import {SignInComponent} from "./pages/sign-in/sign-in.component";
import {SignUpComponent} from "./pages/sign-up/sign-up.component";
import {HomeComponent} from "./pages/home/home.component";
import {ProfileComponent} from "./pages/profile/profile.component";
import {AccountComponent} from './pages/profile/account/account.component';
import {PasswordComponent} from './pages/profile/password/password.component';
import {DisplayComponent} from './pages/profile/display/display.component';
import {GameListComponent} from './pages/home/game-list/game-list.component';
import {GameLobbyComponent} from './pages/home/game-lobby/game-lobby.component';
import {GameComponent} from './pages/home/game/game.component';
import {CardComponent} from './pages/home/game/card/card.component';
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    NavigationComponent,
    FooterComponent,
    InputErrorComponent,
    SignInComponent,
    SignUpComponent,
    HomeComponent,
    ProfileComponent,
    AccountComponent,
    PasswordComponent,
    DisplayComponent,
    GameListComponent,
    GameLobbyComponent,
    GameComponent,
    CardComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFireDatabaseModule,
        FontAwesomeModule,
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
