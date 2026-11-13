import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { PerfilService } from './perfil.service';

/** Sin perfil todavía → pantalla de bienvenida para elegir el nivel. */
export const conPerfil: CanActivateFn = async () => {
  const router = inject(Router);
  const perfil = await inject(PerfilService).cargar();
  return perfil ? true : router.parseUrl('/bienvenida');
};

/** Con perfil ya creado, la bienvenida no se vuelve a mostrar. */
export const sinPerfil: CanActivateFn = async () => {
  const router = inject(Router);
  const perfil = await inject(PerfilService).cargar();
  return perfil ? router.parseUrl('/inicio') : true;
};
