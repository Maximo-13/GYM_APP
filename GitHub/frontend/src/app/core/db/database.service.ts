import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
  type capSQLiteSet,
} from '@capacitor-community/sqlite';

import { MIGRACIONES } from './esquema';

const NOMBRE_BD = 'gym_app';

/** Catálogo exportado del servidor (npm run catalogo → src/assets/catalogo.json). */
interface Catalogo {
  version: number;
  patrones: Record<string, unknown>[];
  musculos: Record<string, unknown>[];
  patronMusculo: Record<string, unknown>[];
  ejercicios: Record<string, unknown>[];
  ejercicioMusculo: Record<string, unknown>[];
}

/**
 * Base de datos local del teléfono (SQLite).
 *
 * En Android/iOS usa SQLite nativo; en el navegador (ng serve) usa sql.js
 * guardado en IndexedDB, para poder desarrollar sin emulador.
 * Al abrir: aplica las migraciones pendientes y actualiza el catálogo.
 */
@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private readonly sqlite = new SQLiteConnection(CapacitorSQLite);
  private readonly esWeb = Capacitor.getPlatform() === 'web';
  private db!: SQLiteDBConnection;
  private listo?: Promise<void>;

  /** Abre la base una sola vez; las llamadas siguientes esperan a la misma promesa. */
  iniciar(): Promise<void> {
    this.listo ??= this.abrir();
    return this.listo;
  }

  async consultar<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    await this.iniciar();
    const res = await this.db.query(sql, params);
    return (res.values ?? []) as T[];
  }

  async ejecutar(sql: string, params: unknown[] = []): Promise<void> {
    await this.iniciar();
    await this.db.run(sql, params, true);
    await this.guardarWeb();
  }

  /** Varias sentencias en una sola transacción: o se aplican todas o ninguna. */
  async lote(sentencias: capSQLiteSet[]): Promise<void> {
    await this.iniciar();
    if (sentencias.length === 0) return;
    await this.db.executeSet(sentencias, true);
    await this.guardarWeb();
  }

  private async abrir(): Promise<void> {
    const t0 = performance.now();
    if (this.esWeb) await this.prepararWeb();

    const consistente = (await this.sqlite.checkConnectionsConsistency()).result;
    const existe = (await this.sqlite.isConnection(NOMBRE_BD, false)).result;
    this.db =
      consistente && existe
        ? await this.sqlite.retrieveConnection(NOMBRE_BD, false)
        : await this.sqlite.createConnection(NOMBRE_BD, false, 'no-encryption', 1, false);
    await this.db.open();
    await this.db.execute('PRAGMA foreign_keys = ON;', false);

    await this.migrar();
    await this.actualizarCatalogo();
    await this.guardarWeb();
    console.debug(`[BD] abierta en ${Math.round(performance.now() - t0)} ms`);
  }

  /** En el navegador, el plugin necesita el componente <jeep-sqlite> (sql.js + IndexedDB). */
  private async prepararWeb(): Promise<void> {
    const { defineCustomElements } = await import('jeep-sqlite/loader');
    await defineCustomElements(window);
    if (!document.querySelector('jeep-sqlite')) {
      const elemento = document.createElement('jeep-sqlite');
      elemento.setAttribute('autoSave', 'true');
      document.body.appendChild(elemento);
    }
    await customElements.whenDefined('jeep-sqlite');
    await this.sqlite.initWebStore();
  }

  private async guardarWeb(): Promise<void> {
    if (this.esWeb) await this.sqlite.saveToStore(NOMBRE_BD);
  }

  /** Aplica en orden las migraciones cuya versión supera PRAGMA user_version. */
  private async migrar(): Promise<void> {
    const res = await this.db.query('PRAGMA user_version;');
    const actual = Number(res.values?.[0]?.user_version ?? 0);
    for (const m of MIGRACIONES.filter((m) => m.version > actual)) {
      await this.db.execute(`${m.sql}\nPRAGMA user_version = ${m.version};`, true);
      console.info(`[BD] migración ${m.version} aplicada: ${m.descripcion}`);
    }
  }

  /**
   * Carga o actualiza el catálogo si la app trae una versión más nueva que la guardada.
   * Usa los mismos UUID que el servidor, así la sincronización no duplica nada.
   */
  private async actualizarCatalogo(): Promise<void> {
    const catalogo: Catalogo = await fetch('assets/catalogo.json').then((r) => r.json());
    const guardada = await this.db.query(`SELECT valor FROM app_meta WHERE clave = 'catalogo_version'`);
    if (Number(guardada.values?.[0]?.valor ?? 0) >= catalogo.version) return;

    const set: capSQLiteSet[] = [];
    const upsert = (tabla: string, filas: Record<string, unknown>[], clave: string[]) => {
      if (filas.length === 0) return;
      const cols = Object.keys(filas[0]);
      const actualizar = cols.filter((c) => !clave.includes(c)).map((c) => `${c} = excluded.${c}`);
      const sql =
        `INSERT INTO ${tabla} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')}) ` +
        `ON CONFLICT (${clave.join(', ')}) DO ` +
        (actualizar.length ? `UPDATE SET ${actualizar.join(', ')}` : 'NOTHING');
      for (const f of filas) set.push({ statement: sql, values: cols.map((c) => f[c]) });
    };

    upsert('musculo', catalogo.musculos, ['id']);
    upsert('patron_articular', catalogo.patrones, ['id']);
    // Las relaciones del catálogo se reemplazan enteras para reflejar también lo que se quitó.
    set.push({ statement: 'DELETE FROM patron_musculo', values: [] });
    upsert('patron_musculo', catalogo.patronMusculo, ['patron_articular_id', 'musculo_id']);
    upsert('ejercicio', catalogo.ejercicios, ['id']);
    set.push({
      statement:
        'DELETE FROM ejercicio_musculo WHERE ejercicio_id IN (SELECT id FROM ejercicio WHERE usuario_id IS NULL)',
      values: [],
    });
    upsert('ejercicio_musculo', catalogo.ejercicioMusculo, ['ejercicio_id', 'musculo_id']);
    set.push({
      statement: `INSERT INTO app_meta (clave, valor) VALUES ('catalogo_version', ?)
                  ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor`,
      values: [String(catalogo.version)],
    });

    await this.db.executeSet(set, true);
    console.info(`[BD] catálogo v${catalogo.version} cargado: ${catalogo.ejercicios.length} ejercicios`);
  }
}
