import { Injectable, inject } from '@angular/core';

import { DatabaseService } from './db/database.service';
import { PerfilService } from './perfil.service';

export interface EjercicioResumen {
  id: string;
  nombre: string;
  musculo: string | null;
  patron_id: string | null;
  patron: string | null;
  patron_orden: number | null;
  equipo: string | null;
  propio: number; // 1 = creado por el usuario
}

/** Lectura del catálogo y de los ejercicios propios del usuario. */
@Injectable({ providedIn: 'root' })
export class EjerciciosService {
  private readonly db = inject(DatabaseService);
  private readonly perfil = inject(PerfilService);

  /** Catálogo + ejercicios propios, ordenados por patrón articular y nombre. */
  listar(): Promise<EjercicioResumen[]> {
    return this.db.consultar<EjercicioResumen>(
      `SELECT e.id, e.nombre, m.nombre AS musculo, p.id AS patron_id, p.nombre AS patron,
              p.orden AS patron_orden, e.equipo, (e.usuario_id IS NOT NULL) AS propio
         FROM ejercicio e
         LEFT JOIN musculo m          ON m.id = e.musculo_id
         LEFT JOIN patron_articular p ON p.id = e.patron_articular_id
        WHERE e.deleted_at IS NULL AND (e.usuario_id IS NULL OR e.usuario_id = ?)
        ORDER BY COALESCE(p.orden, 999), e.nombre`,
      [this.perfil.perfil()?.id ?? ''],
    );
  }
}
