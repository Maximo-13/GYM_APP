import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { CuentaService } from './cuenta.service';
import { PerfilService } from './perfil.service';

/** Sin sesión iniciada → pantalla para entrar o crear cuenta. */
export const conSesion: CanActivateFn = async () => {
  const router = inject(Router);
  const cuenta = inject(CuentaService);
  const perfil = inject(PerfilService);
  if ((await cuenta.haySesion()) && (await perfil.cargar())) return true;
  return router.parseUrl('/entrar');
};

/** Con la sesión ya iniciada, las pantallas de entrar y crear cuenta llevan al inicio. */
export const sinSesion: CanActivateFn = async () => {
  const router = inject(Router);
  const cuenta = inject(CuentaService);
  const perfil = inject(PerfilService);
  if ((await cuenta.haySesion()) && (await perfil.cargar())) return router.parseUrl('/inicio');
  return true;
};
