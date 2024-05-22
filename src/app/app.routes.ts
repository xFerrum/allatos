import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthGuard } from 'src/services/user.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes),
    canActivate: [AuthGuard]
  },
  {
    path: 'registration',
    loadComponent: () => import('./pages/registration/registration.page').then( m => m.RegistrationPage)
  },
  {
    path: 'battle',
    loadComponent: () => import('./pages/battle/battle.page').then( m => m.BattlePage),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  },
];