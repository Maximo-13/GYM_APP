import type { Routes } from '@angular/router';

import { conSesion, sinSesion } from './core/perfil.guard';

export const routes: Routes = [
  {
    path: 'entrar',
    canActivate: [sinSesion],
    loadComponent: () => import('./cuenta/entrar.page').then((m) => m.EntrarPage),
  },
  {
    path: 'crear-cuenta',
    canActivate: [sinSesion],
    loadComponent: () => import('./cuenta/crear-cuenta.page').then((m) => m.CrearCuentaPage),
  },
  {
    path: '',
    canActivateChild: [conSesion],
    children: [
      { path: 'inicio', loadComponent: () => import('./inicio/inicio.page').then((m) => m.InicioPage) },
      { path: 'rutina/:id', loadComponent: () => import('./rutina/rutina.page').then((m) => m.RutinaPage) },
      { path: 'sesion/:id', loadComponent: () => import('./sesion/sesion.page').then((m) => m.SesionPage) },
      { path: 'cuenta', loadComponent: () => import('./cuenta/mi-cuenta.page').then((m) => m.MiCuentaPage) },
      { path: 'patrones', loadComponent: () => import('./patrones/patrones.page').then((m) => m.PatronesPage) },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
