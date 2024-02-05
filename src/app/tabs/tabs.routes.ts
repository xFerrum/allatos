import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'profile',
        loadComponent: () =>
          import('./profiletab/profiletab.page').then((m) => m.ProfilePage),
      },
      {
        path: 'tab2',
        loadComponent: () =>
          import('./tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('./tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: '',
        redirectTo: './profiletab/profiletab.page',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: './profiletab/profiletab.page',
    pathMatch: 'full',
  },
];
