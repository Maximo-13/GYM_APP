import type { Routes } from '@angular/router';

import { conPerfil, sinPerfil } from './core/perfil.guard';

export const routes: Routes = [
  {
    path: 'bienvenida',
    canActivate: [sinPerfil],
    loadComponent: () => import('./bienvenida/bienvenida.page').then((m) => m.BienvenidaPage),
  },
  {
    path: '',
    canActivateChild: [conPerfil],
    children: [
      { path: 'inicio', loadComponent: () => import('./inicio/inicio.page').then((m) => m.InicioPage) },
      { path: 'rutina/:id', loadComponent: () => import('./rutina/rutina.page').then((m) => m.RutinaPage) },
      { path: 'sesion/:id', loadComponent: () => import('./sesion/sesion.page').then((m) => m.SesionPage) },
      { path: 'patrones', loadComponent: () => import('./patrones/patrones.page').then((m) => m.PatronesPage) },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
