-- =====================================================================
-- V1: esquema inicial de la app de registro de entrenamiento
--
-- Convenciones:
--   * id CHAR(36) = UUID generado en el teléfono, para poder crear
--     registros sin internet y sincronizarlos después sin choques.
--   * created_at / updated_at / deleted_at en las tablas del usuario:
--     updated_at decide qué cambio gana al sincronizar y deleted_at
--     marca borrados lógicos para que el otro lado se entere.
--   * Las tablas de catálogo (patron_articular, musculo) son globales.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id                CHAR(36)      NOT NULL,
    email             VARCHAR(255)  NOT NULL,
    password_hash     VARCHAR(255)  NOT NULL,
    nombre            VARCHAR(100)  NOT NULL,
    nivel             ENUM('PRINCIPIANTE','INTERMEDIO','AVANZADO') NOT NULL DEFAULT 'PRINCIPIANTE',
    peso_corporal_kg  DECIMAL(5,2)  NULL,
    objetivo          VARCHAR(100)  NULL,
    dias_por_semana   TINYINT       NULL CHECK (dias_por_semana BETWEEN 1 AND 7),
    idioma            VARCHAR(5)    NOT NULL DEFAULT 'es',
    created_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at        DATETIME(3)   NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Catálogo: patrones articulares (los ~9 básicos) y músculos
-- ---------------------------------------------------------------------
CREATE TABLE patron_articular (
    id                   CHAR(36)     NOT NULL,
    codigo               VARCHAR(50)  NOT NULL,          -- p. ej. ADUCCION_HOMBRO
    nombre               VARCHAR(100) NOT NULL,          -- término técnico
    articulacion         VARCHAR(50)  NOT NULL,          -- hombro, cadera, rodilla...
    plano                ENUM('SAGITAL','FRONTAL','TRANSVERSAL') NULL,
    descripcion_simple   TEXT         NULL,              -- para principiantes
    descripcion_tecnica  TEXT         NULL,              -- para intermedios
    imagen_url           VARCHAR(500) NULL,
    video_url            VARCHAR(500) NULL,
    orden                SMALLINT     NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_patron_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE musculo (
    id      CHAR(36)     NOT NULL,
    codigo  VARCHAR(50)  NOT NULL,                       -- p. ej. DORSAL_ANCHO
    nombre  VARCHAR(100) NOT NULL,
    region  ENUM('TREN_SUPERIOR','TREN_INFERIOR','CORE') NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_musculo_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Ejercicios: usuario_id NULL = ejercicio del catálogo; con valor = propio
-- ---------------------------------------------------------------------
CREATE TABLE ejercicio (
    id                   CHAR(36)     NOT NULL,
    usuario_id           CHAR(36)     NULL,
    nombre               VARCHAR(150) NOT NULL,
    musculo_id           CHAR(36)     NULL,
    patron_articular_id  CHAR(36)     NULL,
    enfasis              ENUM('ESTIRADO','ACORTADO','NEUTRO') NULL,
    equipo               VARCHAR(50)  NULL,              -- máquina, polea, barra...
    notas                TEXT         NULL,
    created_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3)  NULL,
    PRIMARY KEY (id),
    KEY idx_ejercicio_usuario (usuario_id),
    CONSTRAINT fk_ejercicio_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_ejercicio_musculo FOREIGN KEY (musculo_id) REFERENCES musculo (id),
    CONSTRAINT fk_ejercicio_patron  FOREIGN KEY (patron_articular_id) REFERENCES patron_articular (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Primera vez que el usuario registra un ejercicio (RF-06): ya vio la tarjeta
CREATE TABLE ejercicio_intro_vista (
    usuario_id    CHAR(36)    NOT NULL,
    ejercicio_id  CHAR(36)    NOT NULL,
    vista_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (usuario_id, ejercicio_id),
    CONSTRAINT fk_intro_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuario (id),
    CONSTRAINT fk_intro_ejercicio FOREIGN KEY (ejercicio_id) REFERENCES ejercicio (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Rutinas (plantillas como "Pierna A")
-- ---------------------------------------------------------------------
CREATE TABLE rutina (
    id          CHAR(36)     NOT NULL,
    usuario_id  CHAR(36)     NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    dia_semana  TINYINT      NULL CHECK (dia_semana BETWEEN 1 AND 7),   -- 1 = lunes
    orden       SMALLINT     NOT NULL DEFAULT 0,
    created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at  DATETIME(3)  NULL,
    PRIMARY KEY (id),
    KEY idx_rutina_usuario (usuario_id),
    CONSTRAINT fk_rutina_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rutina_ejercicio (
    id               CHAR(36)    NOT NULL,
    rutina_id        CHAR(36)    NOT NULL,
    ejercicio_id     CHAR(36)    NOT NULL,
    orden            SMALLINT    NOT NULL DEFAULT 0,
    series_objetivo  TINYINT     NULL,
    notas            TEXT        NULL,
    created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at       DATETIME(3) NULL,
    PRIMARY KEY (id),
    KEY idx_rutina_ejercicio_rutina (rutina_id),
    CONSTRAINT fk_re_rutina    FOREIGN KEY (rutina_id)    REFERENCES rutina (id),
    CONSTRAINT fk_re_ejercicio FOREIGN KEY (ejercicio_id) REFERENCES ejercicio (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Sesiones: un entrenamiento concreto (con el check-in de contexto)
-- ---------------------------------------------------------------------
CREATE TABLE sesion (
    id            CHAR(36)    NOT NULL,
    usuario_id    CHAR(36)    NOT NULL,
    rutina_id     CHAR(36)    NULL,                      -- NULL = sesión libre
    inicio        DATETIME(3) NOT NULL,
    fin           DATETIME(3) NULL,
    energia       TINYINT     NULL CHECK (energia BETWEEN 1 AND 5),
    estres        TINYINT     NULL CHECK (estres BETWEEN 1 AND 5),
    alimentacion  TINYINT     NULL CHECK (alimentacion BETWEEN 1 AND 5),
    notas         TEXT        NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at    DATETIME(3) NULL,
    PRIMARY KEY (id),
    KEY idx_sesion_usuario_inicio (usuario_id, inicio),
    KEY idx_sesion_rutina_inicio (rutina_id, inicio),        -- comparativa con la semana pasada
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_sesion_rutina  FOREIGN KEY (rutina_id)  REFERENCES rutina (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ejercicios realmente hechos en la sesión (pueden diferir de la rutina)
CREATE TABLE sesion_ejercicio (
    id            CHAR(36)    NOT NULL,
    sesion_id     CHAR(36)    NOT NULL,
    ejercicio_id  CHAR(36)    NOT NULL,
    orden         SMALLINT    NOT NULL DEFAULT 0,
    notas         TEXT        NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at    DATETIME(3) NULL,
    PRIMARY KEY (id),
    KEY idx_se_sesion (sesion_id),
    KEY idx_se_ejercicio (ejercicio_id),                     -- historial por ejercicio
    CONSTRAINT fk_se_sesion    FOREIGN KEY (sesion_id)    REFERENCES sesion (id),
    CONSTRAINT fk_se_ejercicio FOREIGN KEY (ejercicio_id) REFERENCES ejercicio (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE serie (
    id                   CHAR(36)     NOT NULL,
    sesion_ejercicio_id  CHAR(36)     NOT NULL,
    numero               TINYINT      NOT NULL,             -- 1, 2, 3...
    peso_kg              DECIMAL(6,2) NULL,
    repeticiones         SMALLINT     NULL,
    rir                  TINYINT      NULL CHECK (rir BETWEEN 0 AND 10),
    completada           BOOLEAN      NOT NULL DEFAULT FALSE,
    notas                TEXT         NULL,
    created_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3)  NULL,
    PRIMARY KEY (id),
    KEY idx_serie_se (sesion_ejercicio_id, numero),
    CONSTRAINT fk_serie_se FOREIGN KEY (sesion_ejercicio_id) REFERENCES sesion_ejercicio (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Columnas personalizables tipo Excel (tempo, descanso, RPE...)
-- ---------------------------------------------------------------------
CREATE TABLE columna_personalizada (
    id          CHAR(36)     NOT NULL,
    usuario_id  CHAR(36)     NOT NULL,
    nombre      VARCHAR(50)  NOT NULL,
    tipo        ENUM('NUMERO','TEXTO') NOT NULL,
    unidad      VARCHAR(20)  NULL,
    orden       SMALLINT     NOT NULL DEFAULT 0,
    created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at  DATETIME(3)  NULL,
    PRIMARY KEY (id),
    KEY idx_columna_usuario (usuario_id),
    CONSTRAINT fk_columna_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE valor_columna (
    serie_id      CHAR(36)      NOT NULL,
    columna_id    CHAR(36)      NOT NULL,
    valor_numero  DECIMAL(10,2) NULL,
    valor_texto   VARCHAR(255)  NULL,
    updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (serie_id, columna_id),
    CONSTRAINT fk_valor_serie   FOREIGN KEY (serie_id)   REFERENCES serie (id),
    CONSTRAINT fk_valor_columna FOREIGN KEY (columna_id) REFERENCES columna_personalizada (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Hábitos diarios (fase 3): agua, peso, sueño, pasos
-- ---------------------------------------------------------------------
CREATE TABLE registro_diario (
    id                CHAR(36)     NOT NULL,
    usuario_id        CHAR(36)     NOT NULL,
    fecha             DATE         NOT NULL,
    agua_ml           INT          NULL,
    peso_corporal_kg  DECIMAL(5,2) NULL,
    sueno_min         SMALLINT     NULL,
    pasos             INT          NULL,
    fuente            ENUM('MANUAL','HEALTH') NOT NULL DEFAULT 'MANUAL',
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at        DATETIME(3)  NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_registro_usuario_fecha (usuario_id, fecha),
    CONSTRAINT fk_registro_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
