import { Injectable, inject } from '@angular/core';
import type { capSQLiteSet } from '@capacitor-community/sqlite';

import type { DatosSerie } from './comparativa';
import { DatabaseService } from './db/database.service';
import { ahora, nuevoId } from './db/util';
import { PerfilService } from './perfil.service';

export interface Serie extends DatosSerie {
  id: string;
  numero: number;
  rir: number | null;
  completada: boolean;
}

export interface SesionEjercicio {
  id: string;
  ejercicio_id: string;
  nombre: string;
  musculo: string | null;
  patron: string | null;
  patron_simple: string | null;
  patron_tecnica: string | null;
  /** Ya se mostró su acción articular al usuario (RF-06). */
  intro_vista: boolean;
  series: Serie[];
  /** Series de la última vez que hizo este ejercicio, por número de serie (RF-14). */
  anteriores: Record<number, DatosSerie & { rir: number | null }>;
  fecha_anterior: string | null;
}

export interface Sesion {
  id: string;
  rutina_id: string | null;
  rutina: string | null;
  inicio: string;
  fin: string | null;
  ejercicios: SesionEjercicio[];
  /** Tonelaje (kg × reps) de la sesión anterior de la misma rutina (RF-17). */
  tonelaje_anterior: number | null;
}

const SERIES_POR_DEFECTO = 3;

/** Sesiones de entrenamiento: se guardan serie a serie al instante (RNF-03, RNF-04). */
@Injectable({ providedIn: 'root' })
export class SesionesService {
  private readonly db = inject(DatabaseService);
  private readonly perfil = inject(PerfilService);

  private get usuarioId(): string {
    const id = this.perfil.perfil()?.id;
    if (!id) throw new Error('No hay perfil cargado');
    return id;
  }

  /** Sesión empezada y no terminada, para retomarla si se cerró la app. */
  async enCurso(): Promise<{ id: string; rutina: string | null; inicio: string } | null> {
    const [s] = await this.db.consultar<{ id: string; rutina: string | null; inicio: string }>(
      `SELECT s.id, r.nombre AS rutina, s.inicio FROM sesion s
         LEFT JOIN rutina r ON r.id = s.rutina_id
        WHERE s.usuario_id = ? AND s.fin IS NULL AND s.deleted_at IS NULL
        ORDER BY s.inicio DESC LIMIT 1`,
      [this.usuarioId],
    );
    return s ?? null;
  }

  /** Empieza una sesión copiando los ejercicios y series objetivo de la rutina (o vacía). */
  async iniciar(rutinaId: string | null): Promise<string> {
    const t = ahora();
    const sesionId = nuevoId();
    const set: capSQLiteSet[] = [
      {
        statement:
          'INSERT INTO sesion (id, usuario_id, rutina_id, inicio, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        values: [sesionId, this.usuarioId, rutinaId, t, t, t],
      },
    ];
    if (rutinaId) {
      const plan = await this.db.consultar<{ ejercicio_id: string; series_objetivo: number | null }>(
        `SELECT ejercicio_id, series_objetivo FROM rutina_ejercicio
          WHERE rutina_id = ? AND deleted_at IS NULL ORDER BY orden`,
        [rutinaId],
      );
      plan.forEach((p, orden) =>
        set.push(...this.sentenciasEjercicio(sesionId, p.ejercicio_id, orden, p.series_objetivo, t)),
      );
    }
    await this.db.lote(set);
    return sesionId;
  }

  async obtener(id: string): Promise<Sesion | null> {
    const [s] = await this.db.consultar<Omit<Sesion, 'ejercicios' | 'tonelaje_anterior'>>(
      `SELECT s.id, s.rutina_id, r.nombre AS rutina, s.inicio, s.fin
         FROM sesion s LEFT JOIN rutina r ON r.id = s.rutina_id
        WHERE s.id = ? AND s.deleted_at IS NULL`,
      [id],
    );
    if (!s) return null;

    const ejercicios = await this.db.consultar<
      Omit<SesionEjercicio, 'series' | 'anteriores' | 'fecha_anterior' | 'intro_vista'> & { intro_vista: number }
    >(
      `SELECT se.id, se.ejercicio_id, e.nombre, m.nombre AS musculo, p.nombre AS patron,
              p.descripcion_simple AS patron_simple, p.descripcion_tecnica AS patron_tecnica,
              EXISTS (SELECT 1 FROM ejercicio_intro_vista iv
                       WHERE iv.usuario_id = ? AND iv.ejercicio_id = se.ejercicio_id) AS intro_vista
         FROM sesion_ejercicio se
         JOIN ejercicio e             ON e.id = se.ejercicio_id
         LEFT JOIN musculo m          ON m.id = e.musculo_id
         LEFT JOIN patron_articular p ON p.id = e.patron_articular_id
        WHERE se.sesion_id = ? AND se.deleted_at IS NULL
        ORDER BY se.orden`,
      [this.usuarioId, id],
    );
    const series = await this.db.consultar<
      Omit<Serie, 'completada'> & { completada: number; sesion_ejercicio_id: string }
    >(
      `SELECT sr.id, sr.sesion_ejercicio_id, sr.numero, sr.peso_kg, sr.repeticiones, sr.rir, sr.completada
         FROM serie sr JOIN sesion_ejercicio se ON se.id = sr.sesion_ejercicio_id
        WHERE se.sesion_id = ? AND sr.deleted_at IS NULL
        ORDER BY sr.numero`,
      [id],
    );

    const resultado: SesionEjercicio[] = [];
    for (const e of ejercicios) {
      const previo = await this.anterior(e.ejercicio_id, s);
      resultado.push({
        ...e,
        intro_vista: !!e.intro_vista,
        series: series
          .filter((sr) => sr.sesion_ejercicio_id === e.id)
          .map(({ sesion_ejercicio_id: _, ...sr }) => ({ ...sr, completada: !!sr.completada })),
        anteriores: previo.series,
        fecha_anterior: previo.fecha,
      });
    }
    return { ...s, ejercicios: resultado, tonelaje_anterior: await this.tonelajeAnterior(s) };
  }

  /**
   * Últimas series completadas de un ejercicio antes de esta sesión.
   * Primero busca en la misma rutina (RF-14); si nunca lo hizo ahí, en cualquier sesión.
   */
  private async anterior(
    ejercicioId: string,
    sesion: { id: string; rutina_id: string | null; inicio: string },
  ): Promise<{ series: SesionEjercicio['anteriores']; fecha: string | null }> {
    const buscar = (mismaRutina: boolean) =>
      this.db.consultar<{ id: string; inicio: string }>(
        `SELECT se.id, s.inicio FROM sesion_ejercicio se
           JOIN sesion s ON s.id = se.sesion_id
          WHERE se.ejercicio_id = ? AND s.usuario_id = ? AND s.id <> ? AND s.inicio < ?
            AND s.deleted_at IS NULL AND se.deleted_at IS NULL
            ${mismaRutina ? 'AND s.rutina_id = ?' : ''}
            AND EXISTS (SELECT 1 FROM serie sr WHERE sr.sesion_ejercicio_id = se.id
                         AND sr.completada = 1 AND sr.deleted_at IS NULL)
          ORDER BY s.inicio DESC LIMIT 1`,
        [ejercicioId, this.usuarioId, sesion.id, sesion.inicio, ...(mismaRutina ? [sesion.rutina_id] : [])],
      );

    let [previo] = sesion.rutina_id ? await buscar(true) : [];
    previo ??= (await buscar(false))[0];
    if (!previo) return { series: {}, fecha: null };

    const filas = await this.db.consultar<DatosSerie & { numero: number; rir: number | null }>(
      `SELECT numero, peso_kg, repeticiones, rir FROM serie
        WHERE sesion_ejercicio_id = ? AND completada = 1 AND deleted_at IS NULL ORDER BY numero`,
      [previo.id],
    );
    return { series: Object.fromEntries(filas.map((f) => [f.numero, f])), fecha: previo.inicio };
  }

  private async tonelajeAnterior(sesion: {
    id: string;
    rutina_id: string | null;
    inicio: string;
  }): Promise<number | null> {
    if (!sesion.rutina_id) return null;
    const [v] = await this.db.consultar<{ tonelaje_kg: number }>(
      `SELECT tonelaje_kg FROM v_volumen_sesion
        WHERE rutina_id = ? AND sesion_id <> ? AND inicio < ?
        ORDER BY inicio DESC LIMIT 1`,
      [sesion.rutina_id, sesion.id, sesion.inicio],
    );
    return v?.tonelaje_kg ?? null;
  }

  async guardarSerie(serie: Serie): Promise<void> {
    await this.db.ejecutar(
      `UPDATE serie SET peso_kg = ?, repeticiones = ?, rir = ?, completada = ?, updated_at = ? WHERE id = ?`,
      [serie.peso_kg, serie.repeticiones, serie.rir, serie.completada ? 1 : 0, ahora(), serie.id],
    );
  }

  async agregarSerie(sesionEjercicioId: string, numero: number): Promise<Serie> {
    const t = ahora();
    const serie: Serie = { id: nuevoId(), numero, peso_kg: null, repeticiones: null, rir: null, completada: false };
    await this.db.ejecutar(
      'INSERT INTO serie (id, sesion_ejercicio_id, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [serie.id, sesionEjercicioId, numero, t, t],
    );
    return serie;
  }

  /** Borra la serie y renumera las siguientes para que sigan siendo 1, 2, 3... */
  async eliminarSerie(sesionEjercicioId: string, serieId: string, restantes: Serie[]): Promise<void> {
    const t = ahora();
    await this.db.lote([
      { statement: 'UPDATE serie SET deleted_at = ?, updated_at = ? WHERE id = ?', values: [t, t, serieId] },
      ...restantes.map((s, i) => ({
        statement: 'UPDATE serie SET numero = ?, updated_at = ? WHERE id = ? AND sesion_ejercicio_id = ?',
        values: [i + 1, t, s.id, sesionEjercicioId],
      })),
    ]);
  }

  /** Añade un ejercicio al final de la sesión (RF-13). */
  async agregarEjercicio(sesionId: string, ejercicioId: string, orden: number): Promise<void> {
    await this.db.lote(this.sentenciasEjercicio(sesionId, ejercicioId, orden, null, ahora()));
  }

  async quitarEjercicio(sesionEjercicioId: string): Promise<void> {
    const t = ahora();
    await this.db.lote([
      {
        statement: 'UPDATE sesion_ejercicio SET deleted_at = ?, updated_at = ? WHERE id = ?',
        values: [t, t, sesionEjercicioId],
      },
      {
        statement:
          'UPDATE serie SET deleted_at = ?, updated_at = ? WHERE sesion_ejercicio_id = ? AND deleted_at IS NULL',
        values: [t, t, sesionEjercicioId],
      },
    ]);
  }

  /** Guarda el nuevo orden de los ejercicios de la sesión (RF-13). */
  async reordenar(idsEnOrden: string[]): Promise<void> {
    const t = ahora();
    await this.db.lote(
      idsEnOrden.map((id, orden) => ({
        statement: 'UPDATE sesion_ejercicio SET orden = ?, updated_at = ? WHERE id = ?',
        values: [orden, t, id],
      })),
    );
  }

  async marcarIntroVista(ejercicioId: string): Promise<void> {
    await this.db.ejecutar('INSERT OR IGNORE INTO ejercicio_intro_vista (usuario_id, ejercicio_id) VALUES (?, ?)', [
      this.usuarioId,
      ejercicioId,
    ]);
  }

  async finalizar(sesionId: string): Promise<void> {
    const t = ahora();
    await this.db.ejecutar('UPDATE sesion SET fin = ?, updated_at = ? WHERE id = ?', [t, t, sesionId]);
  }

  /** Descarta una sesión empezada por error (borrado lógico de todo lo que contiene). */
  async descartar(sesionId: string): Promise<void> {
    const t = ahora();
    await this.db.lote([
      {
        statement: `UPDATE serie SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL AND sesion_ejercicio_id IN
                      (SELECT id FROM sesion_ejercicio WHERE sesion_id = ?)`,
        values: [t, t, sesionId],
      },
      {
        statement:
          'UPDATE sesion_ejercicio SET deleted_at = ?, updated_at = ? WHERE sesion_id = ? AND deleted_at IS NULL',
        values: [t, t, sesionId],
      },
      { statement: 'UPDATE sesion SET deleted_at = ?, updated_at = ? WHERE id = ?', values: [t, t, sesionId] },
    ]);
  }

  private sentenciasEjercicio(
    sesionId: string,
    ejercicioId: string,
    orden: number,
    numSeries: number | null,
    t: string,
  ): capSQLiteSet[] {
    const seId = nuevoId();
    const set: capSQLiteSet[] = [
      {
        statement: `INSERT INTO sesion_ejercicio (id, sesion_id, ejercicio_id, orden, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)`,
        values: [seId, sesionId, ejercicioId, orden, t, t],
      },
    ];
    for (let n = 1; n <= (numSeries ?? SERIES_POR_DEFECTO); n++) {
      set.push({
        statement: 'INSERT INTO serie (id, sesion_ejercicio_id, numero, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        values: [nuevoId(), seId, n, t, t],
      });
    }
    return set;
  }
}
