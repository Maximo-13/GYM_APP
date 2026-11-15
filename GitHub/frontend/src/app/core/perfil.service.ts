import { Injectable, inject, signal } from '@angular/core';
import type { capSQLiteSet } from '@capacitor-community/sqlite';

import { DatabaseService } from './db/database.service';
import { ahora } from './db/util';

export type Nivel = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';

/** Datos editables del perfil (RF-02, RF-03). */
export interface DatosPerfil {
  nombre: string;
  nivel: Nivel;
  pesoCorporalKg: number | null;
  objetivo: string | null;
  diasPorSemana: number | null;
}

export interface Perfil extends DatosPerfil {
  id: string;
  email: string | null;
}

interface FilaUsuario {
  id: string;
  nombre: string;
  email: string | null;
  nivel: Nivel;
  peso_corporal_kg: number | null;
  objetivo: string | null;
  dias_por_semana: number | null;
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
    const [f] = await this.db.consultar<FilaUsuario>(
      `SELECT u.id, u.nombre, u.email, u.nivel, u.peso_corporal_kg, u.objetivo, u.dias_por_semana
         FROM app_meta m JOIN usuario u ON u.id = m.valor
        WHERE m.clave = 'usuario_actual' AND u.deleted_at IS NULL`,
    );
    this.perfil.set(
      f
        ? {
            id: f.id,
            nombre: f.nombre,
            email: f.email,
            nivel: f.nivel,
            pesoCorporalKg: f.peso_corporal_kg,
            objetivo: f.objetivo,
            diasPorSemana: f.dias_por_semana,
          }
        : null,
    );
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
        statement: `INSERT INTO usuario (id, email, nombre, nivel, peso_corporal_kg, objetivo, dias_por_semana,
                                         created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (id) DO UPDATE SET email = excluded.email, nombre = excluded.nombre,
                      nivel = excluded.nivel, peso_corporal_kg = excluded.peso_corporal_kg,
                      objetivo = excluded.objetivo, dias_por_semana = excluded.dias_por_semana,
                      updated_at = excluded.updated_at, deleted_at = NULL`,
        values: [
          cuenta.id,
          cuenta.email,
          cuenta.nombre,
          cuenta.nivel,
          cuenta.pesoCorporalKg,
          cuenta.objetivo,
          cuenta.diasPorSemana,
          t,
          t,
        ],
      },
      {
        statement: `INSERT OR REPLACE INTO app_meta (clave, valor) VALUES ('usuario_actual', ?)`,
        values: [cuenta.id],
      },
    ]);
    this.perfil.set({ ...cuenta });
  }

  /**
   * Pasa a la cuenta lo que se registró en el teléfono antes de tener cuenta
   * (perfil sin correo). Si el perfil anterior ya era de otra cuenta, no toca nada.
   */
  async adoptarDatosSinCuenta(idAnterior: string, idCuenta: string): Promise<boolean> {
    if (idAnterior === idCuenta) return false;
    const [anterior] = await this.db.consultar<{ email: string | null }>('SELECT email FROM usuario WHERE id = ?', [
      idAnterior,
    ]);
    if (!anterior || anterior.email !== null) return false;

    const mover = (tabla: string): capSQLiteSet => ({
      statement: `UPDATE OR IGNORE ${tabla} SET usuario_id = ? WHERE usuario_id = ?`,
      values: [idCuenta, idAnterior],
    });
    await this.db.lote([
      mover('rutina'),
      mover('sesion'),
      mover('ejercicio'),
      mover('columna_personalizada'),
      mover('registro_diario'),
      mover('ejercicio_intro_vista'),
      // Lo que no se pudo mover por duplicado (mismo día, misma intro) se descarta.
      { statement: 'DELETE FROM registro_diario WHERE usuario_id = ?', values: [idAnterior] },
      { statement: 'DELETE FROM ejercicio_intro_vista WHERE usuario_id = ?', values: [idAnterior] },
      { statement: 'DELETE FROM usuario WHERE id = ?', values: [idAnterior] },
    ]);
    return true;
  }

  /** Borra del teléfono todo lo del usuario (al borrar la cuenta, RNF-07). */
  async borrarDatosLocales(id: string): Promise<void> {
    const deSesiones = `SELECT se.id FROM sesion_ejercicio se JOIN sesion s ON s.id = se.sesion_id WHERE s.usuario_id = ?`;
    const deEjerciciosPropios = 'SELECT id FROM ejercicio WHERE usuario_id = ?';
    await this.db.lote([
      {
        statement: `DELETE FROM valor_columna WHERE serie_id IN (SELECT id FROM serie WHERE sesion_ejercicio_id IN (${deSesiones}))`,
        values: [id],
      },
      { statement: `DELETE FROM serie WHERE sesion_ejercicio_id IN (${deSesiones})`, values: [id] },
      {
        statement: 'DELETE FROM sesion_ejercicio WHERE sesion_id IN (SELECT id FROM sesion WHERE usuario_id = ?)',
        values: [id],
      },
      { statement: 'DELETE FROM sesion WHERE usuario_id = ?', values: [id] },
      {
        statement: 'DELETE FROM rutina_ejercicio WHERE rutina_id IN (SELECT id FROM rutina WHERE usuario_id = ?)',
        values: [id],
      },
      { statement: 'DELETE FROM rutina WHERE usuario_id = ?', values: [id] },
      { statement: 'DELETE FROM columna_personalizada WHERE usuario_id = ?', values: [id] },
      { statement: 'DELETE FROM registro_diario WHERE usuario_id = ?', values: [id] },
      { statement: 'DELETE FROM ejercicio_intro_vista WHERE usuario_id = ?', values: [id] },
      { statement: `DELETE FROM ejercicio_musculo WHERE ejercicio_id IN (${deEjerciciosPropios})`, values: [id] },
      { statement: 'DELETE FROM ejercicio WHERE usuario_id = ?', values: [id] },
      { statement: 'DELETE FROM usuario WHERE id = ?', values: [id] },
      { statement: `DELETE FROM app_meta WHERE clave = 'usuario_actual'`, values: [] },
    ]);
    this.perfil.set(null);
  }

  /** Al cerrar sesión: los datos quedan en el teléfono, pero ya no hay usuario actual. */
  async olvidarActual(): Promise<void> {
    await this.db.ejecutar(`DELETE FROM app_meta WHERE clave = 'usuario_actual'`);
    this.perfil.set(null);
  }
}
