import { Injectable, inject } from '@angular/core';
import type { capSQLiteSet } from '@capacitor-community/sqlite';

import { DatabaseService } from './db/database.service';
import { ahora, nuevoId } from './db/util';
import { PerfilService } from './perfil.service';

export interface RutinaResumen {
  id: string;
  nombre: string;
  dia_semana: number | null;
  num_ejercicios: number;
  ultima_sesion: string | null;
}

export interface RutinaEjercicio {
  id: string;
  ejercicio_id: string;
  nombre: string;
  patron: string | null;
  series_objetivo: number | null;
  notas: string | null;
}

export interface Rutina {
  id: string;
  nombre: string;
  dia_semana: number | null;
  ejercicios: RutinaEjercicio[];
}

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Rutinas o plantillas ("Pierna A") con sus ejercicios en orden (RF-08). */
@Injectable({ providedIn: 'root' })
export class RutinasService {
  private readonly db = inject(DatabaseService);
  private readonly perfil = inject(PerfilService);

  private get usuarioId(): string {
    const id = this.perfil.perfil()?.id;
    if (!id) throw new Error('No hay perfil cargado');
    return id;
  }

  listar(): Promise<RutinaResumen[]> {
    return this.db.consultar<RutinaResumen>(
      `SELECT r.id, r.nombre, r.dia_semana,
              (SELECT COUNT(*) FROM rutina_ejercicio re
                WHERE re.rutina_id = r.id AND re.deleted_at IS NULL) AS num_ejercicios,
              (SELECT MAX(s.inicio) FROM sesion s
                WHERE s.rutina_id = r.id AND s.deleted_at IS NULL) AS ultima_sesion
         FROM rutina r
        WHERE r.usuario_id = ? AND r.deleted_at IS NULL
        ORDER BY COALESCE(r.dia_semana, 8), r.orden, r.nombre`,
      [this.usuarioId],
    );
  }

  async obtener(id: string): Promise<Rutina | null> {
    const [r] = await this.db.consultar<Omit<Rutina, 'ejercicios'>>(
      'SELECT id, nombre, dia_semana FROM rutina WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    if (!r) return null;
    const ejercicios = await this.db.consultar<RutinaEjercicio>(
      `SELECT re.id, re.ejercicio_id, e.nombre, p.nombre AS patron, re.series_objetivo, re.notas
         FROM rutina_ejercicio re
         JOIN ejercicio e             ON e.id = re.ejercicio_id
         LEFT JOIN patron_articular p ON p.id = e.patron_articular_id
        WHERE re.rutina_id = ? AND re.deleted_at IS NULL
        ORDER BY re.orden`,
      [id],
    );
    return { ...r, ejercicios };
  }

  /**
   * Crea o actualiza la rutina con sus ejercicios en el orden dado.
   * Los ejercicios que ya no están se marcan como borrados (borrado lógico, para sincronizar).
   */
  async guardar(rutina: Rutina): Promise<string> {
    const t = ahora();
    const id = rutina.id || nuevoId();
    const set: capSQLiteSet[] = [
      {
        statement: `INSERT INTO rutina (id, usuario_id, nombre, dia_semana, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre,
                      dia_semana = excluded.dia_semana, updated_at = excluded.updated_at`,
        values: [id, this.usuarioId, rutina.nombre.trim(), rutina.dia_semana, t, t],
      },
    ];

    const ids = rutina.ejercicios.map((e) => e.id || nuevoId());
    set.push({
      statement: `UPDATE rutina_ejercicio SET deleted_at = ?, updated_at = ?
                   WHERE rutina_id = ? AND deleted_at IS NULL
                     AND id NOT IN (${ids.map(() => '?').join(', ') || "''"})`,
      values: [t, t, id, ...ids],
    });
    rutina.ejercicios.forEach((e, orden) =>
      set.push({
        statement: `INSERT INTO rutina_ejercicio
                      (id, rutina_id, ejercicio_id, orden, series_objetivo, notas, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (id) DO UPDATE SET orden = excluded.orden,
                      series_objetivo = excluded.series_objetivo, notas = excluded.notas,
                      updated_at = excluded.updated_at`,
        values: [ids[orden], id, e.ejercicio_id, orden, e.series_objetivo, e.notas, t, t],
      }),
    );

    await this.db.lote(set);
    return id;
  }

  async eliminar(id: string): Promise<void> {
    const t = ahora();
    await this.db.lote([
      { statement: 'UPDATE rutina SET deleted_at = ?, updated_at = ? WHERE id = ?', values: [t, t, id] },
      {
        statement:
          'UPDATE rutina_ejercicio SET deleted_at = ?, updated_at = ? WHERE rutina_id = ? AND deleted_at IS NULL',
        values: [t, t, id],
      },
    ]);
  }
}
