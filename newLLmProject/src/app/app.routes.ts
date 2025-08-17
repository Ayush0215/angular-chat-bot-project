import { Routes } from '@angular/router';
import { LoginComponent } from './comp/login/login.component';
import { AppComponent } from './app.component';
import { SignUpComponent } from './comp/sign-up/sign-up.component';
import { HomeComponent } from './comp/home/home.component';
import { SettingsComponent } from './comp/settings/settings.component';
import { SettingActionComponent } from './comp/settings/setting-action/setting-action.component';
import { SettingPermissionComponent } from './comp/settings/setting-permission/setting-permission.component';
import { SettingDashboardComponent } from './comp/settings/setting-dashboard/setting-dashboard.component';
import { ProfileDashbordComponent } from './comp/profile-dashbord/profile-dashbord.component';
import { GeneralComponent } from './comp/profile-dashbord/general/general.component';
import { BuilderProfileComponent } from './comp/profile-dashbord/builder-profile/builder-profile.component';
import { ConnectedAppsComponent } from './comp/profile-dashbord/connected-apps/connected-apps.component';
import { DataControlsComponent } from './comp/profile-dashbord/data-controls/data-controls.component';
import { PersonalizationComponent } from './comp/profile-dashbord/personalization/personalization.component';
import { SecurityComponent } from './comp/profile-dashbord/security/security.component';
import { SpeechComponent } from './comp/profile-dashbord/speech/speech.component';
import { ChatOnComponent } from './comp/chat-on/chat-on.component';
import { AuthGuard } from './guard/auth.guard';
import { SettingAIModelComponent } from './comp/settings/setting-ai-model/setting-ai-model.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'sign-up',
    component: SignUpComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'setting-dashboard', pathMatch: 'full' },
      { path: 'setting-dashboard', component: SettingDashboardComponent },
      { path: 'setting-action', component: SettingActionComponent },
      { path: 'setting-permission', component: SettingPermissionComponent },
      {
        path: 'setting-ai-model',
        component: SettingAIModelComponent,
      },
    ],
  },

  {
    path: 'prodashboard',
    component: ProfileDashbordComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'general',
        component: GeneralComponent,
      },
      {
        path: 'builder-profile',
        component: BuilderProfileComponent,
      },
      {
        path: 'connected-apps',
        component: ConnectedAppsComponent,
      },
      {
        path: 'data-controls',
        component: DataControlsComponent,
      },
      {
        path: 'personalization',
        component: PersonalizationComponent,
      },
      {
        path: 'security',
        component: SecurityComponent,
      },
      {
        path: 'speech',
        component: SpeechComponent,
      },
    ],
  },
  {
    path: 'preview-con',
    component: ChatOnComponent,
  },
];
