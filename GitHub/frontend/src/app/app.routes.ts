import type { Routes } from '@angular/router';

import { conPerfil, sinPerfil } from './core/perfil.guard';

export const routes: Routes = [
  {
    path: 'bienvenida',
    canActivate: [sinPerfil],
    loadComponent: () => import('./bienvenida/bienvenida.page').then((m) => m.BienvenidaPage),
  },
  {
    path: 'inicio',
    canActivate: [conPerfil],
    loadComponent: () => import('./inicio/inicio.page').then((m) => m.InicioPage),
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
];
