import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'creatures',
        loadComponent: () =>
          import('./creaturestab/creaturestab.page').then((m) => m.CreaturesPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profiletab/profiletab.page').then((m) => m.ProfilePage),
      },
      {
        path: 'arena',
        loadComponent: () =>
          import('./arenatab/arenatab.page').then((m) => m.ArenaPage),
      },
      {
        path: '',
        redirectTo: 'creatures',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'creatures',
    pathMatch: 'full',
  },
];
