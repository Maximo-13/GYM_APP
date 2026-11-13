import { Injectable, inject, signal } from '@angular/core';

import { DatabaseService } from './db/database.service';
import { ahora, nuevoId } from './db/util';

export type Nivel = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';

export interface Perfil {
  id: string;
  nombre: string | null;
  nivel: Nivel;
}

/**
 * Perfil local del usuario. Se crea al elegir el nivel la primera vez (RF-02),
 * sin necesidad de cuenta: cuando exista el login (RF-01), este mismo id se
 * enviará al servidor para vincular los datos ya registrados.
 */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly db = inject(DatabaseService);
  readonly perfil = signal<Perfil | null>(null);

  /** Carga el perfil guardado (si existe) en la señal `perfil`. */
  async cargar(): Promise<Perfil | null> {
    const [fila] = await this.db.consultar<Perfil>(
      `SELECT u.id, u.nombre, u.nivel FROM app_meta m
         JOIN usuario u ON u.id = m.valor
        WHERE m.clave = 'usuario_actual' AND u.deleted_at IS NULL`,
    );
    this.perfil.set(fila ?? null);
    return this.perfil();
  }

  async crear(nivel: Nivel, nombre: string | null = null): Promise<Perfil> {
    const id = nuevoId();
    await this.db.lote([
      { statement: 'INSERT INTO usuario (id, nombre, nivel) VALUES (?, ?, ?)', values: [id, nombre, nivel] },
      { statement: `INSERT OR REPLACE INTO app_meta (clave, valor) VALUES ('usuario_actual', ?)`, values: [id] },
    ]);
    const perfil = { id, nombre, nivel };
    this.perfil.set(perfil);
    return perfil;
  }

  async cambiarNivel(nivel: Nivel): Promise<void> {
    const actual = this.perfil();
    if (!actual) return;
    await this.db.ejecutar('UPDATE usuario SET nivel = ?, updated_at = ? WHERE id = ?', [nivel, ahora(), actual.id]);
    this.perfil.set({ ...actual, nivel });
  }
}
