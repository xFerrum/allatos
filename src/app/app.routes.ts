import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { UserService } from 'src/services/user.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes),
    canActivate: [() => inject(UserService).isLoggedIn()]
  },
  {
    path: 'registration',
    loadComponent: () => import('./pages/registration/registration.page').then( m => m.RegistrationPage)
  },
  //TODO: remove this after testing, shouldnt be accessible through url
  {
    path: 'battle',
    loadComponent: () => import('./pages/battle/battle.page').then( m => m.BattlePage)
  },
];