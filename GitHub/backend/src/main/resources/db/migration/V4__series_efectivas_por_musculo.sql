-- =====================================================================
-- V4: series efectivas por músculo
--
-- Cada ejercicio reparte cada serie entre los músculos que trabaja:
--   1.00 = músculo principal (serie completa)
--   0.50 = secundario que trabaja mucho (p. ej. bíceps en jalón supino)
--   0.25 = secundario que trabaja poco (p. ej. bíceps en jalón prono)
-- El usuario puede ajustar estos factores en sus ejercicios propios.
-- =====================================================================

CREATE TABLE ejercicio_musculo (
    ejercicio_id  CHAR(36)     NOT NULL,
    musculo_id    CHAR(36)     NOT NULL,
    factor        DECIMAL(3,2) NOT NULL CHECK (factor > 0 AND factor <= 1),
    PRIMARY KEY (ejercicio_id, musculo_id),
    KEY idx_em_musculo (musculo_id),
    CONSTRAINT fk_em_ejercicio FOREIGN KEY (ejercicio_id) REFERENCES ejercicio (id),
    CONSTRAINT fk_em_musculo   FOREIGN KEY (musculo_id)   REFERENCES musculo (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Músculo principal de cada ejercicio del catálogo = serie completa
INSERT INTO ejercicio_musculo (ejercicio_id, musculo_id, factor)
SELECT id, musculo_id, 1.00 FROM ejercicio WHERE musculo_id IS NOT NULL;

-- Músculos secundarios
INSERT INTO ejercicio_musculo (ejercicio_id, musculo_id, factor) VALUES
    ('66a3d872-ad9b-5213-b9d1-a3b9912a7479', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 0.50),  -- JALON_CERRADO_SUPINO / BICEPS
    ('66a3d872-ad9b-5213-b9d1-a3b9912a7479', '1a7a85c4-d1d0-5521-95c5-ed7bf45cba3a', 0.25),  -- JALON_CERRADO_SUPINO / DELTOIDES_POSTERIOR
    ('cef49d49-868a-5a09-835a-2603c1c703bc', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 0.25),  -- JALON_ABIERTO / BICEPS
    ('66c92e5b-6747-5015-9350-66a29846ad06', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 0.25),  -- JALON_MAQUINA / BICEPS
    ('810907b6-a5ae-5c60-9632-52cee90ea452', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 0.25),  -- DOMINADAS / BICEPS
    ('9a65ff4f-7118-5cd4-84f3-e05d3d02b3a7', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 0.25),  -- REMO_MANCUERNA / BICEPS
    ('9a65ff4f-7118-5cd4-84f3-e05d3d02b3a7', '1a7a85c4-d1d0-5521-95c5-ed7bf45cba3a', 0.25),  -- REMO_MANCUERNA / DELTOIDES_POSTERIOR
    ('68e0181c-7042-579f-ac5d-4262c84719e0', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 0.25),  -- REMO_POLEA_CERRADO / BICEPS
    ('68e0181c-7042-579f-ac5d-4262c84719e0', '1a7a85c4-d1d0-5521-95c5-ed7bf45cba3a', 0.25),  -- REMO_POLEA_CERRADO / DELTOIDES_POSTERIOR
    ('c44712fb-fdae-54c3-92eb-42a94e4dffb5', 'a20f4d66-c309-53fc-bfd3-8937d4828457', 0.50),  -- REMO_ABIERTO_BARRA / ROMBOIDES
    ('c44712fb-fdae-54c3-92eb-42a94e4dffb5', '1a7a85c4-d1d0-5521-95c5-ed7bf45cba3a', 0.50),  -- REMO_ABIERTO_BARRA / DELTOIDES_POSTERIOR
    ('c44712fb-fdae-54c3-92eb-42a94e4dffb5', '0e791bdc-97a0-50c9-94a6-49c857ffb820', 0.25),  -- REMO_ABIERTO_BARRA / DORSAL_ANCHO
    ('c44712fb-fdae-54c3-92eb-42a94e4dffb5', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 0.25),  -- REMO_ABIERTO_BARRA / BICEPS
    ('56d84454-3878-5827-84cd-cba8688f522f', 'a20f4d66-c309-53fc-bfd3-8937d4828457', 0.50),  -- REMO_ABIERTO_MAQUINA / ROMBOIDES
    ('56d84454-3878-5827-84cd-cba8688f522f', '1a7a85c4-d1d0-5521-95c5-ed7bf45cba3a', 0.50),  -- REMO_ABIERTO_MAQUINA / DELTOIDES_POSTERIOR
    ('56d84454-3878-5827-84cd-cba8688f522f', '0e791bdc-97a0-50c9-94a6-49c857ffb820', 0.25),  -- REMO_ABIERTO_MAQUINA / DORSAL_ANCHO
    ('56d84454-3878-5827-84cd-cba8688f522f', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 0.25),  -- REMO_ABIERTO_MAQUINA / BICEPS
    ('8f0407e7-d654-5eb4-9d19-474366af3a9b', '5974ac73-cb12-50d4-a881-2dec8279e042', 0.50),  -- FACE_PULL / TRAPECIO
    ('8f0407e7-d654-5eb4-9d19-474366af3a9b', 'a20f4d66-c309-53fc-bfd3-8937d4828457', 0.25),  -- FACE_PULL / ROMBOIDES
    ('640a9175-21c7-5570-8320-78f6a59e9f95', '5974ac73-cb12-50d4-a881-2dec8279e042', 0.25),  -- PAJAROS_MAQUINA / TRAPECIO
    ('640a9175-21c7-5570-8320-78f6a59e9f95', 'a20f4d66-c309-53fc-bfd3-8937d4828457', 0.25),  -- PAJAROS_MAQUINA / ROMBOIDES
    ('b196ca9d-b5cc-578e-bdb8-090f3493e1e8', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', 0.25),  -- PULLOVER_POLEA / PECTORAL_MAYOR
    ('b196ca9d-b5cc-578e-bdb8-090f3493e1e8', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 0.25),  -- PULLOVER_POLEA / TRICEPS
    ('f5c9f07d-bce0-53e5-b775-5ef56df4a1a3', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 0.50),  -- PRESS_BANCA / TRICEPS
    ('f5c9f07d-bce0-53e5-b775-5ef56df4a1a3', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 0.50),  -- PRESS_BANCA / DELTOIDES_ANTERIOR
    ('a0100109-acca-505c-825a-5dfe991e7cfc', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 0.50),  -- PRESS_PECHO_MAQUINA / TRICEPS
    ('a0100109-acca-505c-825a-5dfe991e7cfc', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 0.50),  -- PRESS_PECHO_MAQUINA / DELTOIDES_ANTERIOR
    ('2533db60-57da-592b-9f87-15f1376fe4f8', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', 0.50),  -- PRESS_INCLINADO_MANCUERNAS / PECTORAL_MAYOR
    ('2533db60-57da-592b-9f87-15f1376fe4f8', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 0.50),  -- PRESS_INCLINADO_MANCUERNAS / DELTOIDES_ANTERIOR
    ('2533db60-57da-592b-9f87-15f1376fe4f8', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 0.50),  -- PRESS_INCLINADO_MANCUERNAS / TRICEPS
    ('f22f9f96-92b2-57d2-b550-bf7fe8f0bdb6', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', 0.50),  -- PRESS_INCLINADO_BARRA / PECTORAL_MAYOR
    ('f22f9f96-92b2-57d2-b550-bf7fe8f0bdb6', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 0.50),  -- PRESS_INCLINADO_BARRA / DELTOIDES_ANTERIOR
    ('f22f9f96-92b2-57d2-b550-bf7fe8f0bdb6', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 0.50),  -- PRESS_INCLINADO_BARRA / TRICEPS
    ('fca0719b-5c75-5818-bafe-e9d979aa0653', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 0.25),  -- APERTURAS_MANCUERNAS / DELTOIDES_ANTERIOR
    ('7d6d51bf-7edf-5f16-bbce-3148f140bed6', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 0.25),  -- PEC_DECK / DELTOIDES_ANTERIOR
    ('12707f62-6913-524a-a3d8-8e2d28d595db', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 0.25),  -- CRUCE_POLEAS / DELTOIDES_ANTERIOR
    ('9bd728cd-cd8d-5e2e-9c68-c91abd3cc1c3', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 0.50),  -- CRUCE_POLEAS_BAJO / DELTOIDES_ANTERIOR
    ('2194bc6d-ca8f-5f65-b425-d60587640bab', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 0.50),  -- PRESS_MILITAR / TRICEPS
    ('2194bc6d-ca8f-5f65-b425-d60587640bab', '2b28b1a8-9e15-5e28-87d3-29b5555c7ee5', 0.50),  -- PRESS_MILITAR / DELTOIDES_LATERAL
    ('2194bc6d-ca8f-5f65-b425-d60587640bab', 'bcf4b0cb-3519-569a-bc78-b587fc04e12b', 0.25),  -- PRESS_MILITAR / PECTORAL_SUPERIOR
    ('19b226b7-f8ae-5ffd-8e81-e97ffe0f8bee', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 0.50),  -- PRESS_HOMBRO_MANCUERNAS / TRICEPS
    ('19b226b7-f8ae-5ffd-8e81-e97ffe0f8bee', '2b28b1a8-9e15-5e28-87d3-29b5555c7ee5', 0.50),  -- PRESS_HOMBRO_MANCUERNAS / DELTOIDES_LATERAL
    ('19b226b7-f8ae-5ffd-8e81-e97ffe0f8bee', 'bcf4b0cb-3519-569a-bc78-b587fc04e12b', 0.25),  -- PRESS_HOMBRO_MANCUERNAS / PECTORAL_SUPERIOR
    ('e0a3e085-9f93-5502-bea1-b21322eefa19', 'bcf4b0cb-3519-569a-bc78-b587fc04e12b', 0.25),  -- ELEVACION_FRONTAL / PECTORAL_SUPERIOR
    ('b496ae38-7974-5709-9ccc-5cbbc236c3fd', '5974ac73-cb12-50d4-a881-2dec8279e042', 0.25),  -- ELEVACION_LATERAL / TRAPECIO
    ('a7ad193e-89c7-517e-b8c1-4fc0d0c1aba2', '5974ac73-cb12-50d4-a881-2dec8279e042', 0.25),  -- ELEVACION_LATERAL_POLEA / TRAPECIO
    ('178d071a-ca62-5e84-b44a-590d52516c4d', '5974ac73-cb12-50d4-a881-2dec8279e042', 0.25),  -- ELEVACION_LATERAL_MAQUINA / TRAPECIO
    ('f0c02873-d051-527d-9351-63ee742c131b', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 0.50),  -- CURL_MARTILLO / BICEPS
    ('f0c02873-d051-527d-9351-63ee742c131b', '2694e095-c92e-5120-a36e-c87fe537573f', 0.50),  -- CURL_MARTILLO / BRAQUIAL
    ('a2fbb67a-ec17-5655-a20f-cba3dc237657', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 0.50),  -- SENTADILLA_BARRA / GLUTEO_MAYOR
    ('a2fbb67a-ec17-5655-a20f-cba3dc237657', '100355b3-693f-5e0f-bf9c-1e1a63836535', 0.50),  -- SENTADILLA_BARRA / ADUCTORES
    ('a2fbb67a-ec17-5655-a20f-cba3dc237657', 'e17065d3-086c-53b6-bf5d-74b981c09ab9', 0.25),  -- SENTADILLA_BARRA / ERECTORES_ESPINALES
    ('b7c16747-4220-5649-aa6f-9dbf467a9d3c', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 0.50),  -- SENTADILLA_HACK / GLUTEO_MAYOR
    ('b7c16747-4220-5649-aa6f-9dbf467a9d3c', '100355b3-693f-5e0f-bf9c-1e1a63836535', 0.25),  -- SENTADILLA_HACK / ADUCTORES
    ('2134cd92-8cc4-565b-9c1c-e33bf82e9099', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 0.50),  -- PRENSA / GLUTEO_MAYOR
    ('2134cd92-8cc4-565b-9c1c-e33bf82e9099', '100355b3-693f-5e0f-bf9c-1e1a63836535', 0.25),  -- PRENSA / ADUCTORES
    ('a34340dd-e80e-5dd3-891f-b294a18f0530', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 0.50),  -- SENTADILLA_BULGARA / GLUTEO_MAYOR
    ('a34340dd-e80e-5dd3-891f-b294a18f0530', '100355b3-693f-5e0f-bf9c-1e1a63836535', 0.25),  -- SENTADILLA_BULGARA / ADUCTORES
    ('22b8acf9-430e-5b0b-ba9c-2e689e7f4562', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 0.50),  -- PESO_MUERTO_RUMANO / GLUTEO_MAYOR
    ('22b8acf9-430e-5b0b-ba9c-2e689e7f4562', '100355b3-693f-5e0f-bf9c-1e1a63836535', 0.25),  -- PESO_MUERTO_RUMANO / ADUCTORES
    ('22b8acf9-430e-5b0b-ba9c-2e689e7f4562', 'e17065d3-086c-53b6-bf5d-74b981c09ab9', 0.25),  -- PESO_MUERTO_RUMANO / ERECTORES_ESPINALES
    ('d90e893f-1f00-5d09-b0f7-253db0c98d8e', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 0.50),  -- PESO_MUERTO_RUMANO_MANCUERNAS / GLUTEO_MAYOR
    ('d90e893f-1f00-5d09-b0f7-253db0c98d8e', '100355b3-693f-5e0f-bf9c-1e1a63836535', 0.25),  -- PESO_MUERTO_RUMANO_MANCUERNAS / ADUCTORES
    ('d90e893f-1f00-5d09-b0f7-253db0c98d8e', 'e17065d3-086c-53b6-bf5d-74b981c09ab9', 0.25),  -- PESO_MUERTO_RUMANO_MANCUERNAS / ERECTORES_ESPINALES
    ('a2e457f4-831a-5633-b114-d45bfa7b31bb', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', 0.50),  -- PESO_MUERTO / ISQUIOTIBIALES
    ('a2e457f4-831a-5633-b114-d45bfa7b31bb', 'e17065d3-086c-53b6-bf5d-74b981c09ab9', 0.50),  -- PESO_MUERTO / ERECTORES_ESPINALES
    ('a2e457f4-831a-5633-b114-d45bfa7b31bb', '5e5c16cd-a7ce-5c2b-960f-7e56386a3a66', 0.25),  -- PESO_MUERTO / CUADRICEPS
    ('a2e457f4-831a-5633-b114-d45bfa7b31bb', '100355b3-693f-5e0f-bf9c-1e1a63836535', 0.25),  -- PESO_MUERTO / ADUCTORES
    ('a2e457f4-831a-5633-b114-d45bfa7b31bb', '5974ac73-cb12-50d4-a881-2dec8279e042', 0.25),  -- PESO_MUERTO / TRAPECIO
    ('fbe0ba02-1ff0-59c1-8794-3e3487ab3367', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 0.50),  -- BUENOS_DIAS / GLUTEO_MAYOR
    ('fbe0ba02-1ff0-59c1-8794-3e3487ab3367', 'e17065d3-086c-53b6-bf5d-74b981c09ab9', 0.50),  -- BUENOS_DIAS / ERECTORES_ESPINALES
    ('72c2c57c-707f-5219-9f71-7aae09599fd5', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', 0.50),  -- HIPEREXTENSION_45 / ISQUIOTIBIALES
    ('72c2c57c-707f-5219-9f71-7aae09599fd5', 'e17065d3-086c-53b6-bf5d-74b981c09ab9', 0.25),  -- HIPEREXTENSION_45 / ERECTORES_ESPINALES
    ('96c41dcf-bf8d-5fbe-89b1-80b9daa29dcd', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', 0.25),  -- HIP_THRUST / ISQUIOTIBIALES
    ('96c41dcf-bf8d-5fbe-89b1-80b9daa29dcd', '100355b3-693f-5e0f-bf9c-1e1a63836535', 0.25),  -- HIP_THRUST / ADUCTORES
    ('046172a4-e50b-5d8b-936a-8a00e0055799', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', 0.50),  -- HIPEREXTENSION_INVERSA / ISQUIOTIBIALES
    ('222502de-2303-52e7-ba9c-23faaeba94f6', '9b76624c-2a00-576a-b074-dca401905b79', 0.25),  -- CURL_NORDICO / GEMELOS
    ('76e3d609-c6b8-5ab9-b1e0-e44d10c61dab', '7b393e99-f686-5c54-ba69-61d310ffded4', 0.50),  -- ELEVACION_PIERNAS_COLGADO / RECTO_ABDOMINAL
    ('42a75118-de9a-5e95-a2e4-04aaee3f19b7', '7b393e99-f686-5c54-ba69-61d310ffded4', 0.50),  -- ELEVACION_RODILLAS_PARALELAS / RECTO_ABDOMINAL
    ('9945041c-67a9-59ce-a5aa-8b0295b7f6f8', '7b393e99-f686-5c54-ba69-61d310ffded4', 0.50),  -- SIT_UP_DECLINADO / RECTO_ABDOMINAL
    ('1ad6b4ac-10a9-5a43-8cec-e61a95d463e6', 'ebdeaa3d-e9e4-5d39-a8a5-7b2ee32c5bd2', 0.25),  -- CRUNCH / OBLICUOS
    ('a8868e96-cca7-5433-a3c6-bd1d2224c943', 'ebdeaa3d-e9e4-5d39-a8a5-7b2ee32c5bd2', 0.25),  -- CRUNCH_POLEA / OBLICUOS
    ('6c86292a-0381-5c82-963d-4ec29402c139', 'ebdeaa3d-e9e4-5d39-a8a5-7b2ee32c5bd2', 0.25);  -- CRUNCH_MAQUINA / OBLICUOS

-- ---------------------------------------------------------------------
-- Vista: series efectivas y tonelaje por músculo y semana (lunes a domingo)
-- Solo cuenta series completadas y no borradas.
-- ---------------------------------------------------------------------
CREATE VIEW v_volumen_semanal_musculo AS
SELECT
    s.usuario_id,
    DATE_SUB(DATE(s.inicio), INTERVAL WEEKDAY(s.inicio) DAY)   AS semana_inicio,
    m.id                                                       AS musculo_id,
    m.nombre                                                   AS musculo,
    SUM(em.factor)                                             AS series_efectivas,
    SUM(em.factor = 1)                                         AS series_directas,
    SUM(IF(em.factor = 1, sr.peso_kg * sr.repeticiones, 0))    AS tonelaje_directo_kg
FROM serie sr
JOIN sesion_ejercicio se ON se.id = sr.sesion_ejercicio_id AND se.deleted_at IS NULL
JOIN sesion s            ON s.id = se.sesion_id           AND s.deleted_at IS NULL
JOIN ejercicio_musculo em ON em.ejercicio_id = se.ejercicio_id
JOIN musculo m           ON m.id = em.musculo_id
WHERE sr.completada = TRUE AND sr.deleted_at IS NULL
GROUP BY s.usuario_id, semana_inicio, m.id, m.nombre;

-- ---------------------------------------------------------------------
-- Vista: volumen total de cada sesión
-- ---------------------------------------------------------------------
CREATE VIEW v_volumen_sesion AS
SELECT
    s.id                                   AS sesion_id,
    s.usuario_id,
    s.rutina_id,
    s.inicio,
    COUNT(sr.id)                           AS series_completadas,
    SUM(sr.repeticiones)                   AS repeticiones_totales,
    SUM(sr.peso_kg * sr.repeticiones)      AS tonelaje_kg
FROM sesion s
JOIN sesion_ejercicio se ON se.sesion_id = s.id AND se.deleted_at IS NULL
JOIN serie sr            ON sr.sesion_ejercicio_id = se.id
                        AND sr.completada = TRUE AND sr.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.usuario_id, s.rutina_id, s.inicio;
