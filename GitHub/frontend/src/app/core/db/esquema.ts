/**
 * Esquema de la base de datos del teléfono (SQLite).
 *
 * Es el espejo de las tablas de MySQL (backend/src/main/resources/db/migration),
 * con estas diferencias propias de SQLite:
 *  - Fechas como TEXT en ISO 8601 UTC ("2026-11-13T18:30:00.000Z").
 *  - Booleanos como INTEGER (0 / 1) y ENUM como TEXT con CHECK.
 *  - updated_at lo pone la app en cada cambio (SQLite no tiene ON UPDATE).
 *  - El usuario no guarda contraseña: eso solo vive en el servidor.
 *  - app_meta es local: guarda el usuario actual y la versión del catálogo.
 *
 * Igual que con Flyway, nunca se edita una migración ya publicada:
 * los cambios van en una migración nueva al final de la lista.
 */
export interface MigracionLocal {
  version: number;
  descripcion: string;
  sql: string;
}

const TIEMPOS = `
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    deleted_at  TEXT`;

export const MIGRACIONES: MigracionLocal[] = [
  {
    version: 1,
    descripcion: 'esquema inicial (equivalente a V1 a V4 del servidor)',
    sql: `
CREATE TABLE IF NOT EXISTS app_meta (
    clave  TEXT PRIMARY KEY NOT NULL,
    valor  TEXT
);

CREATE TABLE IF NOT EXISTS usuario (
    id                TEXT PRIMARY KEY NOT NULL,
    email             TEXT UNIQUE,
    nombre            TEXT,
    nivel             TEXT NOT NULL DEFAULT 'PRINCIPIANTE'
                      CHECK (nivel IN ('PRINCIPIANTE','INTERMEDIO','AVANZADO')),
    peso_corporal_kg  REAL,
    objetivo          TEXT,
    dias_por_semana   INTEGER CHECK (dias_por_semana BETWEEN 1 AND 7),
    idioma            TEXT NOT NULL DEFAULT 'es',${TIEMPOS}
);

-- ----------------------------- Catálogo -----------------------------
CREATE TABLE IF NOT EXISTS patron_articular (
    id                   TEXT PRIMARY KEY NOT NULL,
    codigo               TEXT NOT NULL UNIQUE,
    nombre               TEXT NOT NULL,
    articulacion         TEXT NOT NULL,
    plano                TEXT CHECK (plano IN ('SAGITAL','FRONTAL','TRANSVERSAL')),
    descripcion_simple   TEXT,
    descripcion_tecnica  TEXT,
    imagen_url           TEXT,
    video_url            TEXT,
    orden                INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS musculo (
    id      TEXT PRIMARY KEY NOT NULL,
    codigo  TEXT NOT NULL UNIQUE,
    nombre  TEXT NOT NULL,
    region  TEXT NOT NULL CHECK (region IN ('TREN_SUPERIOR','TREN_INFERIOR','CORE'))
);

CREATE TABLE IF NOT EXISTS patron_musculo (
    patron_articular_id  TEXT NOT NULL REFERENCES patron_articular (id),
    musculo_id           TEXT NOT NULL REFERENCES musculo (id),
    rol                  TEXT NOT NULL CHECK (rol IN ('PRINCIPAL','SECUNDARIO')),
    PRIMARY KEY (patron_articular_id, musculo_id)
);

-- usuario_id NULL = ejercicio del catálogo
CREATE TABLE IF NOT EXISTS ejercicio (
    id                   TEXT PRIMARY KEY NOT NULL,
    usuario_id           TEXT REFERENCES usuario (id),
    codigo               TEXT UNIQUE,
    nombre               TEXT NOT NULL,
    musculo_id           TEXT REFERENCES musculo (id),
    patron_articular_id  TEXT REFERENCES patron_articular (id),
    enfasis              TEXT CHECK (enfasis IN ('ESTIRADO','ACORTADO','NEUTRO')),
    equipo               TEXT,
    notas                TEXT,${TIEMPOS}
);
CREATE INDEX IF NOT EXISTS idx_ejercicio_usuario ON ejercicio (usuario_id);

-- Series efectivas: 1 = principal, 0.5 = secundario que trabaja mucho, 0.25 = poco
CREATE TABLE IF NOT EXISTS ejercicio_musculo (
    ejercicio_id  TEXT NOT NULL REFERENCES ejercicio (id),
    musculo_id    TEXT NOT NULL REFERENCES musculo (id),
    factor        REAL NOT NULL CHECK (factor > 0 AND factor <= 1),
    PRIMARY KEY (ejercicio_id, musculo_id)
);
CREATE INDEX IF NOT EXISTS idx_em_musculo ON ejercicio_musculo (musculo_id);

CREATE TABLE IF NOT EXISTS ejercicio_intro_vista (
    usuario_id    TEXT NOT NULL REFERENCES usuario (id),
    ejercicio_id  TEXT NOT NULL REFERENCES ejercicio (id),
    vista_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (usuario_id, ejercicio_id)
);

-- ----------------------------- Rutinas ------------------------------
CREATE TABLE IF NOT EXISTS rutina (
    id          TEXT PRIMARY KEY NOT NULL,
    usuario_id  TEXT NOT NULL REFERENCES usuario (id),
    nombre      TEXT NOT NULL,
    dia_semana  INTEGER CHECK (dia_semana BETWEEN 1 AND 7),
    orden       INTEGER NOT NULL DEFAULT 0,${TIEMPOS}
);
CREATE INDEX IF NOT EXISTS idx_rutina_usuario ON rutina (usuario_id);

CREATE TABLE IF NOT EXISTS rutina_ejercicio (
    id               TEXT PRIMARY KEY NOT NULL,
    rutina_id        TEXT NOT NULL REFERENCES rutina (id),
    ejercicio_id     TEXT NOT NULL REFERENCES ejercicio (id),
    orden            INTEGER NOT NULL DEFAULT 0,
    series_objetivo  INTEGER,
    notas            TEXT,${TIEMPOS}
);
CREATE INDEX IF NOT EXISTS idx_rutina_ejercicio_rutina ON rutina_ejercicio (rutina_id);

-- ----------------------------- Sesiones -----------------------------
CREATE TABLE IF NOT EXISTS sesion (
    id            TEXT PRIMARY KEY NOT NULL,
    usuario_id    TEXT NOT NULL REFERENCES usuario (id),
    rutina_id     TEXT REFERENCES rutina (id),
    inicio        TEXT NOT NULL,
    fin           TEXT,
    energia       INTEGER CHECK (energia BETWEEN 1 AND 5),
    estres        INTEGER CHECK (estres BETWEEN 1 AND 5),
    alimentacion  INTEGER CHECK (alimentacion BETWEEN 1 AND 5),
    notas         TEXT,${TIEMPOS}
);
CREATE INDEX IF NOT EXISTS idx_sesion_usuario_inicio ON sesion (usuario_id, inicio);
CREATE INDEX IF NOT EXISTS idx_sesion_rutina_inicio ON sesion (rutina_id, inicio);

CREATE TABLE IF NOT EXISTS sesion_ejercicio (
    id            TEXT PRIMARY KEY NOT NULL,
    sesion_id     TEXT NOT NULL REFERENCES sesion (id),
    ejercicio_id  TEXT NOT NULL REFERENCES ejercicio (id),
    orden         INTEGER NOT NULL DEFAULT 0,
    notas         TEXT,${TIEMPOS}
);
CREATE INDEX IF NOT EXISTS idx_se_sesion ON sesion_ejercicio (sesion_id);
CREATE INDEX IF NOT EXISTS idx_se_ejercicio ON sesion_ejercicio (ejercicio_id);

CREATE TABLE IF NOT EXISTS serie (
    id                   TEXT PRIMARY KEY NOT NULL,
    sesion_ejercicio_id  TEXT NOT NULL REFERENCES sesion_ejercicio (id),
    numero               INTEGER NOT NULL,
    peso_kg              REAL,
    repeticiones         INTEGER,
    rir                  INTEGER CHECK (rir BETWEEN 0 AND 10),
    completada           INTEGER NOT NULL DEFAULT 0 CHECK (completada IN (0, 1)),
    notas                TEXT,${TIEMPOS}
);
CREATE INDEX IF NOT EXISTS idx_serie_se ON serie (sesion_ejercicio_id, numero);

-- ----------------------- Columnas personalizadas --------------------
CREATE TABLE IF NOT EXISTS columna_personalizada (
    id          TEXT PRIMARY KEY NOT NULL,
    usuario_id  TEXT NOT NULL REFERENCES usuario (id),
    nombre      TEXT NOT NULL,
    tipo        TEXT NOT NULL CHECK (tipo IN ('NUMERO','TEXTO')),
    unidad      TEXT,
    orden       INTEGER NOT NULL DEFAULT 0,${TIEMPOS}
);
CREATE INDEX IF NOT EXISTS idx_columna_usuario ON columna_personalizada (usuario_id);

CREATE TABLE IF NOT EXISTS valor_columna (
    serie_id      TEXT NOT NULL REFERENCES serie (id),
    columna_id    TEXT NOT NULL REFERENCES columna_personalizada (id),
    valor_numero  REAL,
    valor_texto   TEXT,
    updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (serie_id, columna_id)
);

-- ------------------------------ Hábitos -----------------------------
CREATE TABLE IF NOT EXISTS registro_diario (
    id                TEXT PRIMARY KEY NOT NULL,
    usuario_id        TEXT NOT NULL REFERENCES usuario (id),
    fecha             TEXT NOT NULL,
    agua_ml           INTEGER,
    peso_corporal_kg  REAL,
    sueno_min         INTEGER,
    pasos             INTEGER,
    fuente            TEXT NOT NULL DEFAULT 'MANUAL' CHECK (fuente IN ('MANUAL','HEALTH')),${TIEMPOS},
    UNIQUE (usuario_id, fecha)
);

-- ----------------------- Vistas de volumen --------------------------
-- Semana de lunes a domingo, en la hora local del teléfono.
CREATE VIEW IF NOT EXISTS v_volumen_semanal_musculo AS
SELECT
    s.usuario_id,
    date(s.inicio, 'localtime', '-' || ((CAST(strftime('%w', s.inicio, 'localtime') AS INTEGER) + 6) % 7) || ' days') AS semana_inicio,
    m.id                                                  AS musculo_id,
    m.nombre                                              AS musculo,
    SUM(em.factor)                                        AS series_efectivas,
    SUM(em.factor = 1)                                    AS series_directas,
    SUM(CASE WHEN em.factor = 1 THEN sr.peso_kg * sr.repeticiones ELSE 0 END) AS tonelaje_directo_kg
FROM serie sr
JOIN sesion_ejercicio se  ON se.id = sr.sesion_ejercicio_id AND se.deleted_at IS NULL
JOIN sesion s             ON s.id = se.sesion_id            AND s.deleted_at IS NULL
JOIN ejercicio_musculo em ON em.ejercicio_id = se.ejercicio_id
JOIN musculo m            ON m.id = em.musculo_id
WHERE sr.completada = 1 AND sr.deleted_at IS NULL
GROUP BY s.usuario_id, semana_inicio, m.id, m.nombre;

CREATE VIEW IF NOT EXISTS v_volumen_sesion AS
SELECT
    s.id                               AS sesion_id,
    s.usuario_id,
    s.rutina_id,
    s.inicio,
    COUNT(sr.id)                       AS series_completadas,
    SUM(sr.repeticiones)               AS repeticiones_totales,
    SUM(sr.peso_kg * sr.repeticiones)  AS tonelaje_kg
FROM sesion s
JOIN sesion_ejercicio se ON se.sesion_id = s.id AND se.deleted_at IS NULL
JOIN serie sr            ON sr.sesion_ejercicio_id = se.id
                        AND sr.completada = 1 AND sr.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.usuario_id, s.rutina_id, s.inicio;
`,
  },
];
