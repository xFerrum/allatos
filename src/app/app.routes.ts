import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthGuard } from 'src/services/user.service';
import { LoginRegGuard } from 'src/services/user.service';

export const routes: Routes = [
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage),
    canActivate: [LoginRegGuard]
  },
  {
    path: 'registration',
    loadComponent: () => import('./pages/registration/registration.page').then( m => m.RegistrationPage),
    canActivate: [LoginRegGuard]
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