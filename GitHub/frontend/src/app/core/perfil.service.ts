import { Injectable, inject, signal } from '@angular/core';

import { DatabaseService } from './db/database.service';
import { ahora } from './db/util';

export type Nivel = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';

export interface Perfil {
  id: string;
  nombre: string | null;
  email: string | null;
  nivel: Nivel;
}

/**
 * Perfil del usuario en la base del teléfono. Es una copia de la cuenta del
 * servidor (mismo id), para que la app funcione sin internet una vez iniciada la sesión.
 */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly db = inject(DatabaseService);
  readonly perfil = signal<Perfil | null>(null);

  /** Carga el perfil del usuario actual (si existe) en la señal `perfil`. */
  async cargar(): Promise<Perfil | null> {
    const [fila] = await this.db.consultar<Perfil>(
      `SELECT u.id, u.nombre, u.email, u.nivel FROM app_meta m
         JOIN usuario u ON u.id = m.valor
        WHERE m.clave = 'usuario_actual' AND u.deleted_at IS NULL`,
    );
    this.perfil.set(fila ?? null);
    return this.perfil();
  }

  /**
   * Id del perfil que había en el teléfono antes de iniciar sesión (de versiones
   * anteriores, sin cuenta). Se envía al crear la cuenta para conservar sus datos.
   */
  async idLocalPrevio(): Promise<string | null> {
    const [fila] = await this.db.consultar<{ valor: string }>(
      `SELECT valor FROM app_meta WHERE clave = 'usuario_actual'`,
    );
    return fila?.valor ?? null;
  }

  /** Guarda (o actualiza) en el teléfono la cuenta del servidor y la marca como actual. */
  async establecer(cuenta: Perfil): Promise<void> {
    const t = ahora();
    await this.db.lote([
      {
        statement: `INSERT INTO usuario (id, email, nombre, nivel, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT (id) DO UPDATE SET email = excluded.email, nombre = excluded.nombre,
                      nivel = excluded.nivel, updated_at = excluded.updated_at, deleted_at = NULL`,
        values: [cuenta.id, cuenta.email, cuenta.nombre, cuenta.nivel, t, t],
      },
      {
        statement: `INSERT OR REPLACE INTO app_meta (clave, valor) VALUES ('usuario_actual', ?)`,
        values: [cuenta.id],
      },
    ]);
    this.perfil.set({ ...cuenta });
  }

  /** Al cerrar sesión: los datos quedan en el teléfono, pero ya no hay usuario actual. */
  async olvidarActual(): Promise<void> {
    await this.db.ejecutar(`DELETE FROM app_meta WHERE clave = 'usuario_actual'`);
    this.perfil.set(null);
  }

  async cambiarNivel(nivel: Nivel): Promise<void> {
    const actual = this.perfil();
    if (!actual) return;
    await this.db.ejecutar('UPDATE usuario SET nivel = ?, updated_at = ? WHERE id = ?', [nivel, ahora(), actual.id]);
    this.perfil.set({ ...actual, nivel });
  }
}
