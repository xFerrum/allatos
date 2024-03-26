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
        path: 'creatures',
        loadComponent: () =>
          import('./creaturestab/creaturestab.page').then((m) => m.CreaturesPage),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('./tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full',
  },
];
