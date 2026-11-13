-- =====================================================================
-- V2: catálogo de patrones articulares, músculos y ejercicios base
--
-- Generado con UUID deterministas (SHA-1 de "gymapp:<tipo>:<codigo>"):
-- el mismo catálogo tendrá los mismos id en el servidor y en el teléfono.
-- Las descripciones son un borrador para que el autor las revise.
-- =====================================================================

ALTER TABLE ejercicio
    ADD COLUMN codigo VARCHAR(80) NULL AFTER usuario_id,
    ADD UNIQUE KEY uk_ejercicio_codigo (codigo);

-- Un patrón puede tener varios músculos (principales y secundarios)
CREATE TABLE patron_musculo (
    patron_articular_id  CHAR(36) NOT NULL,
    musculo_id           CHAR(36) NOT NULL,
    rol                  ENUM('PRINCIPAL','SECUNDARIO') NOT NULL,
    PRIMARY KEY (patron_articular_id, musculo_id),
    CONSTRAINT fk_pm_patron  FOREIGN KEY (patron_articular_id) REFERENCES patron_articular (id),
    CONSTRAINT fk_pm_musculo FOREIGN KEY (musculo_id)          REFERENCES musculo (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Músculos
INSERT INTO musculo (id, codigo, nombre, region) VALUES
    ('1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', 'PECTORAL_MAYOR', 'Pectoral mayor', 'TREN_SUPERIOR'),
    ('42fed807-1bb4-5be7-abfb-224aea2cb88a', 'DELTOIDES_ANTERIOR', 'Deltoides anterior', 'TREN_SUPERIOR'),
    ('2b28b1a8-9e15-5e28-87d3-29b5555c7ee5', 'DELTOIDES_LATERAL', 'Deltoides lateral', 'TREN_SUPERIOR'),
    ('1a7a85c4-d1d0-5521-95c5-ed7bf45cba3a', 'DELTOIDES_POSTERIOR', 'Deltoides posterior', 'TREN_SUPERIOR'),
    ('0e791bdc-97a0-50c9-94a6-49c857ffb820', 'DORSAL_ANCHO', 'Dorsal ancho', 'TREN_SUPERIOR'),
    ('5974ac73-cb12-50d4-a881-2dec8279e042', 'TRAPECIO', 'Trapecio', 'TREN_SUPERIOR'),
    ('a20f4d66-c309-53fc-bfd3-8937d4828457', 'ROMBOIDES', 'Romboides', 'TREN_SUPERIOR'),
    ('f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 'BICEPS', 'Bíceps braquial', 'TREN_SUPERIOR'),
    ('2694e095-c92e-5120-a36e-c87fe537573f', 'BRAQUIAL', 'Braquial', 'TREN_SUPERIOR'),
    ('22202b79-edf8-530c-b9a2-ee25c7fa3430', 'BRAQUIORRADIAL', 'Braquiorradial', 'TREN_SUPERIOR'),
    ('737b9d22-4be8-5f7c-b9e1-3243126813e2', 'TRICEPS', 'Tríceps braquial', 'TREN_SUPERIOR'),
    ('7b393e99-f686-5c54-ba69-61d310ffded4', 'RECTO_ABDOMINAL', 'Recto abdominal', 'CORE'),
    ('ebdeaa3d-e9e4-5d39-a8a5-7b2ee32c5bd2', 'OBLICUOS', 'Oblicuos', 'CORE'),
    ('e17065d3-086c-53b6-bf5d-74b981c09ab9', 'ERECTORES_ESPINALES', 'Erectores espinales (zona lumbar)', 'CORE'),
    ('f6e7694e-4db6-5ef7-b91d-45fd1a278843', 'GLUTEO_MAYOR', 'Glúteo mayor', 'TREN_INFERIOR'),
    ('5e5c16cd-a7ce-5c2b-960f-7e56386a3a66', 'CUADRICEPS', 'Cuádriceps', 'TREN_INFERIOR'),
    ('039a70e9-6bf9-5e07-913d-3f1bb49990ad', 'ISQUIOTIBIALES', 'Isquiotibiales', 'TREN_INFERIOR'),
    ('100355b3-693f-5e0f-bf9c-1e1a63836535', 'ADUCTORES', 'Aductores', 'TREN_INFERIOR'),
    ('cade82a6-2430-5ddb-80a1-a303f627d9b4', 'ILIOPSOAS', 'Iliopsoas', 'TREN_INFERIOR'),
    ('9b76624c-2a00-576a-b074-dca401905b79', 'GEMELOS', 'Gemelos', 'TREN_INFERIOR'),
    ('447ecbdd-9b9e-589f-9aeb-78127c5dadf5', 'SOLEO', 'Sóleo', 'TREN_INFERIOR');

-- Patrones articulares
INSERT INTO patron_articular (id, codigo, nombre, articulacion, plano, descripcion_simple, descripcion_tecnica, orden) VALUES
    ('19a11ce7-4dbe-5f0e-9faa-61b73f5b4339', 'FLEXION_CODO', 'Flexión de codo', 'codo', 'SAGITAL',
     'Doblas el codo y acercas la mano al hombro.',
     'Disminuye el ángulo del codo. Motor principal: flexores del codo, sobre todo el bíceps braquial, con el braquial y el braquiorradial.', 1),
    ('e6aa4655-852d-53c3-9aa4-37772d623333', 'EXTENSION_CODO', 'Extensión de codo', 'codo', 'SAGITAL',
     'Estiras el brazo y alejas la mano del hombro.',
     'Aumenta el ángulo del codo. Motor principal: tríceps braquial; su cabeza larga también cruza el hombro.', 2),
    ('f9ad45d3-74c2-5fa3-bc87-8485fbdfcec9', 'FLEXION_HOMBRO', 'Flexión de hombro', 'hombro', 'SAGITAL',
     'Subes el brazo por delante del cuerpo.',
     'El húmero avanza en el plano sagital. Motor principal: deltoides anterior, con ayuda de la porción clavicular del pectoral.', 3),
    ('31dcc61c-a13d-53fd-a507-fbc405c20803', 'ABDUCCION_HOMBRO', 'Abducción de hombro', 'hombro', 'FRONTAL',
     'Subes el brazo por el costado, alejándolo del cuerpo.',
     'El húmero se separa del tronco en el plano frontal. Motor principal: deltoides lateral; por encima de 90 grados participa el trapecio rotando la escápula.', 4),
    ('2de89f39-0bd9-58ec-95b1-68635167630c', 'ADUCCION_HOMBRO', 'Aducción de hombro', 'hombro', 'FRONTAL',
     'Bajas el brazo por el costado hacia el cuerpo, como al cerrar las alas.',
     'El húmero se acerca al tronco en el plano frontal, como en el jalón abierto. Motor principal: dorsal ancho.', 5),
    ('ba095112-8572-5e0b-85c6-5aec06cd0dd0', 'EXTENSION_HOMBRO', 'Extensión de hombro', 'hombro', 'SAGITAL',
     'Llevas el brazo desde delante hacia atrás, con el codo cerca del cuerpo.',
     'El húmero retrocede en el plano sagital, como en el remo con codos pegados o el pullover. Motor principal: dorsal ancho.', 6),
    ('556a7df8-f807-556e-9077-b888c95a41bf', 'ADUCCION_HORIZONTAL_HOMBRO', 'Aducción horizontal de hombro', 'hombro', 'TRANSVERSAL',
     'Con el brazo a la altura del hombro, lo llevas hacia el centro del pecho, como en un abrazo.',
     'El húmero se acerca a la línea media en el plano transversal, como en el press de banca o las aperturas. Motor principal: pectoral mayor.', 7),
    ('678ba349-d307-5c4e-b492-02dc920c3bef', 'EXTENSION_HORIZONTAL_HOMBRO', 'Extensión horizontal de hombro con retracción escapular', 'hombro', 'TRANSVERSAL',
     'Con los brazos abiertos a la altura del pecho, los llevas hacia atrás y juntas los omóplatos.',
     'El húmero se aleja de la línea media en el plano transversal mientras las escápulas se retraen (y se protraen al volver), como en el remo con brazos abiertos. Motores principales: trapecio medio, romboides y deltoides posterior.', 8),
    ('45fa5585-0eba-5c31-8766-46ff88282f17', 'FLEXION_RODILLA', 'Flexión de rodilla', 'rodilla', 'SAGITAL',
     'Doblas la rodilla y acercas el talón al glúteo.',
     'Disminuye el ángulo de la rodilla. Motor principal: isquiotibiales; al cruzar también la cadera, trabajan más estirados con la cadera flexionada (sentado).', 9),
    ('720c6ca9-b985-5f80-89aa-570025350fd2', 'EXTENSION_RODILLA', 'Extensión de rodilla', 'rodilla', 'SAGITAL',
     'Estiras la rodilla y alejas el pie del glúteo.',
     'Aumenta el ángulo de la rodilla. Motor principal: cuádriceps; el recto femoral también cruza la cadera.', 10),
    ('b8f3da07-6171-57ae-be72-f6872fa0c499', 'EXTENSION_CADERA', 'Extensión de cadera', 'cadera', 'SAGITAL',
     'Llevas el muslo hacia atrás o, con los pies fijos, empujas la cadera hacia delante para enderezar el tronco.',
     'Aumenta el ángulo entre tronco y muslo. Motores principales: glúteo mayor e isquiotibiales, con ayuda del aductor mayor.', 11),
    ('da4c70c5-d4ca-5753-aa3b-69a71d9c531e', 'FLEXION_CADERA', 'Flexión de cadera', 'cadera', 'SAGITAL',
     'Subes la rodilla hacia el pecho.',
     'Disminuye el ángulo entre tronco y muslo. Motor principal: iliopsoas, con el recto femoral del cuádriceps.', 12),
    ('32ace286-7ab4-5d4b-b9f7-f6b173bf9f5e', 'FLEXION_COLUMNA', 'Flexión de columna', 'columna', 'SAGITAL',
     'Enrollas la espalda acercando el pecho a la pelvis.',
     'La columna se flexiona vértebra a vértebra. Motor principal: recto abdominal, con los oblicuos.', 13),
    ('d0669fa1-0446-50b5-a1aa-778a3808d05a', 'EXTENSION_COLUMNA', 'Extensión de columna', 'columna', 'SAGITAL',
     'Desenrollas la espalda hasta dejarla recta o ligeramente arqueada.',
     'La columna se extiende desde la flexión. Motor principal: erectores espinales de la zona lumbar.', 14),
    ('b2572f3c-17f1-5a73-b1ce-dcf1c07e4572', 'FLEXION_PLANTAR', 'Flexión plantar de tobillo', 'tobillo', 'SAGITAL',
     'Te pones de puntillas.',
     'El pie apunta hacia abajo. Motores principales: gemelos (más activos con la rodilla estirada) y sóleo (más activo con la rodilla doblada).', 15);

-- Músculos de cada patrón
INSERT INTO patron_musculo (patron_articular_id, musculo_id, rol) VALUES
    ('19a11ce7-4dbe-5f0e-9faa-61b73f5b4339', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', 'PRINCIPAL'),  -- FLEXION_CODO / BICEPS
    ('19a11ce7-4dbe-5f0e-9faa-61b73f5b4339', '2694e095-c92e-5120-a36e-c87fe537573f', 'PRINCIPAL'),  -- FLEXION_CODO / BRAQUIAL
    ('19a11ce7-4dbe-5f0e-9faa-61b73f5b4339', '22202b79-edf8-530c-b9a2-ee25c7fa3430', 'SECUNDARIO'),  -- FLEXION_CODO / BRAQUIORRADIAL
    ('e6aa4655-852d-53c3-9aa4-37772d623333', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 'PRINCIPAL'),  -- EXTENSION_CODO / TRICEPS
    ('f9ad45d3-74c2-5fa3-bc87-8485fbdfcec9', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 'PRINCIPAL'),  -- FLEXION_HOMBRO / DELTOIDES_ANTERIOR
    ('f9ad45d3-74c2-5fa3-bc87-8485fbdfcec9', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', 'SECUNDARIO'),  -- FLEXION_HOMBRO / PECTORAL_MAYOR
    ('31dcc61c-a13d-53fd-a507-fbc405c20803', '2b28b1a8-9e15-5e28-87d3-29b5555c7ee5', 'PRINCIPAL'),  -- ABDUCCION_HOMBRO / DELTOIDES_LATERAL
    ('31dcc61c-a13d-53fd-a507-fbc405c20803', '5974ac73-cb12-50d4-a881-2dec8279e042', 'SECUNDARIO'),  -- ABDUCCION_HOMBRO / TRAPECIO
    ('2de89f39-0bd9-58ec-95b1-68635167630c', '0e791bdc-97a0-50c9-94a6-49c857ffb820', 'PRINCIPAL'),  -- ADUCCION_HOMBRO / DORSAL_ANCHO
    ('ba095112-8572-5e0b-85c6-5aec06cd0dd0', '0e791bdc-97a0-50c9-94a6-49c857ffb820', 'PRINCIPAL'),  -- EXTENSION_HOMBRO / DORSAL_ANCHO
    ('ba095112-8572-5e0b-85c6-5aec06cd0dd0', '1a7a85c4-d1d0-5521-95c5-ed7bf45cba3a', 'SECUNDARIO'),  -- EXTENSION_HOMBRO / DELTOIDES_POSTERIOR
    ('ba095112-8572-5e0b-85c6-5aec06cd0dd0', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 'SECUNDARIO'),  -- EXTENSION_HOMBRO / TRICEPS
    ('556a7df8-f807-556e-9077-b888c95a41bf', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', 'PRINCIPAL'),  -- ADUCCION_HORIZONTAL_HOMBRO / PECTORAL_MAYOR
    ('556a7df8-f807-556e-9077-b888c95a41bf', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 'SECUNDARIO'),  -- ADUCCION_HORIZONTAL_HOMBRO / DELTOIDES_ANTERIOR
    ('678ba349-d307-5c4e-b492-02dc920c3bef', '5974ac73-cb12-50d4-a881-2dec8279e042', 'PRINCIPAL'),  -- EXTENSION_HORIZONTAL_HOMBRO / TRAPECIO
    ('678ba349-d307-5c4e-b492-02dc920c3bef', 'a20f4d66-c309-53fc-bfd3-8937d4828457', 'PRINCIPAL'),  -- EXTENSION_HORIZONTAL_HOMBRO / ROMBOIDES
    ('678ba349-d307-5c4e-b492-02dc920c3bef', '1a7a85c4-d1d0-5521-95c5-ed7bf45cba3a', 'PRINCIPAL'),  -- EXTENSION_HORIZONTAL_HOMBRO / DELTOIDES_POSTERIOR
    ('45fa5585-0eba-5c31-8766-46ff88282f17', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', 'PRINCIPAL'),  -- FLEXION_RODILLA / ISQUIOTIBIALES
    ('45fa5585-0eba-5c31-8766-46ff88282f17', '9b76624c-2a00-576a-b074-dca401905b79', 'SECUNDARIO'),  -- FLEXION_RODILLA / GEMELOS
    ('720c6ca9-b985-5f80-89aa-570025350fd2', '5e5c16cd-a7ce-5c2b-960f-7e56386a3a66', 'PRINCIPAL'),  -- EXTENSION_RODILLA / CUADRICEPS
    ('b8f3da07-6171-57ae-be72-f6872fa0c499', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 'PRINCIPAL'),  -- EXTENSION_CADERA / GLUTEO_MAYOR
    ('b8f3da07-6171-57ae-be72-f6872fa0c499', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', 'PRINCIPAL'),  -- EXTENSION_CADERA / ISQUIOTIBIALES
    ('b8f3da07-6171-57ae-be72-f6872fa0c499', '100355b3-693f-5e0f-bf9c-1e1a63836535', 'SECUNDARIO'),  -- EXTENSION_CADERA / ADUCTORES
    ('da4c70c5-d4ca-5753-aa3b-69a71d9c531e', 'cade82a6-2430-5ddb-80a1-a303f627d9b4', 'PRINCIPAL'),  -- FLEXION_CADERA / ILIOPSOAS
    ('da4c70c5-d4ca-5753-aa3b-69a71d9c531e', '5e5c16cd-a7ce-5c2b-960f-7e56386a3a66', 'SECUNDARIO'),  -- FLEXION_CADERA / CUADRICEPS
    ('32ace286-7ab4-5d4b-b9f7-f6b173bf9f5e', '7b393e99-f686-5c54-ba69-61d310ffded4', 'PRINCIPAL'),  -- FLEXION_COLUMNA / RECTO_ABDOMINAL
    ('32ace286-7ab4-5d4b-b9f7-f6b173bf9f5e', 'ebdeaa3d-e9e4-5d39-a8a5-7b2ee32c5bd2', 'SECUNDARIO'),  -- FLEXION_COLUMNA / OBLICUOS
    ('d0669fa1-0446-50b5-a1aa-778a3808d05a', 'e17065d3-086c-53b6-bf5d-74b981c09ab9', 'PRINCIPAL'),  -- EXTENSION_COLUMNA / ERECTORES_ESPINALES
    ('b2572f3c-17f1-5a73-b1ce-dcf1c07e4572', '9b76624c-2a00-576a-b074-dca401905b79', 'PRINCIPAL'),  -- FLEXION_PLANTAR / GEMELOS
    ('b2572f3c-17f1-5a73-b1ce-dcf1c07e4572', '447ecbdd-9b9e-589f-9aeb-78127c5dadf5', 'PRINCIPAL');  -- FLEXION_PLANTAR / SOLEO

-- Ejercicios del catálogo (usuario_id NULL)
INSERT INTO ejercicio (id, codigo, usuario_id, nombre, musculo_id, patron_articular_id, enfasis, equipo) VALUES
    ('cb1383aa-d92b-584d-9a86-803989d827a1', 'CURL_BARRA', NULL, 'Curl de bíceps con barra', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', '19a11ce7-4dbe-5f0e-9faa-61b73f5b4339', NULL, 'barra'),
    ('598e5467-aec3-54c8-9913-ce005d06927d', 'CURL_MANCUERNAS', NULL, 'Curl de bíceps con mancuernas', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', '19a11ce7-4dbe-5f0e-9faa-61b73f5b4339', NULL, 'mancuernas'),
    ('9409c202-16a5-505d-afc4-11ef5b8278b7', 'CURL_INCLINADO', NULL, 'Curl inclinado con mancuernas', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', '19a11ce7-4dbe-5f0e-9faa-61b73f5b4339', 'ESTIRADO', 'mancuernas'),
    ('6baf5dad-67fe-5c85-bd9d-26c07bd6bfd4', 'CURL_PREDICADOR', NULL, 'Curl predicador', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', '19a11ce7-4dbe-5f0e-9faa-61b73f5b4339', NULL, 'máquina'),
    ('da9cb667-9525-5885-b217-c0e49b27c728', 'CURL_POLEA', NULL, 'Curl en polea', 'f2dbdd6d-1d24-5372-bcc0-b59b4a9a7204', '19a11ce7-4dbe-5f0e-9faa-61b73f5b4339', NULL, 'polea'),
    ('f0c02873-d051-527d-9351-63ee742c131b', 'CURL_MARTILLO', NULL, 'Curl martillo', '22202b79-edf8-530c-b9a2-ee25c7fa3430', '19a11ce7-4dbe-5f0e-9faa-61b73f5b4339', NULL, 'mancuernas'),
    ('c2931c77-285e-5e83-81f5-443f89fe8685', 'TRICEPS_POLEA', NULL, 'Extensión de tríceps en polea', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 'e6aa4655-852d-53c3-9aa4-37772d623333', 'ACORTADO', 'polea'),
    ('63fffe3b-e918-5be3-840b-7fa1e147b53f', 'TRICEPS_SOBRE_CABEZA', NULL, 'Extensión de tríceps sobre la cabeza', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 'e6aa4655-852d-53c3-9aa4-37772d623333', 'ESTIRADO', 'polea'),
    ('7828fca0-7b29-565c-be1c-c78feed450ef', 'PRESS_FRANCES', NULL, 'Press francés', '737b9d22-4be8-5f7c-b9e1-3243126813e2', 'e6aa4655-852d-53c3-9aa4-37772d623333', NULL, 'barra Z'),
    ('2194bc6d-ca8f-5f65-b425-d60587640bab', 'PRESS_MILITAR', NULL, 'Press militar', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 'f9ad45d3-74c2-5fa3-bc87-8485fbdfcec9', NULL, 'barra'),
    ('19b226b7-f8ae-5ffd-8e81-e97ffe0f8bee', 'PRESS_HOMBRO_MANCUERNAS', NULL, 'Press de hombro con mancuernas', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 'f9ad45d3-74c2-5fa3-bc87-8485fbdfcec9', NULL, 'mancuernas'),
    ('e0a3e085-9f93-5502-bea1-b21322eefa19', 'ELEVACION_FRONTAL', NULL, 'Elevación frontal', '42fed807-1bb4-5be7-abfb-224aea2cb88a', 'f9ad45d3-74c2-5fa3-bc87-8485fbdfcec9', NULL, 'mancuernas'),
    ('b496ae38-7974-5709-9ccc-5cbbc236c3fd', 'ELEVACION_LATERAL', NULL, 'Elevaciones laterales con mancuernas', '2b28b1a8-9e15-5e28-87d3-29b5555c7ee5', '31dcc61c-a13d-53fd-a507-fbc405c20803', NULL, 'mancuernas'),
    ('a7ad193e-89c7-517e-b8c1-4fc0d0c1aba2', 'ELEVACION_LATERAL_POLEA', NULL, 'Elevaciones laterales en polea', '2b28b1a8-9e15-5e28-87d3-29b5555c7ee5', '31dcc61c-a13d-53fd-a507-fbc405c20803', NULL, 'polea'),
    ('178d071a-ca62-5e84-b44a-590d52516c4d', 'ELEVACION_LATERAL_MAQUINA', NULL, 'Elevaciones laterales en máquina', '2b28b1a8-9e15-5e28-87d3-29b5555c7ee5', '31dcc61c-a13d-53fd-a507-fbc405c20803', NULL, 'máquina'),
    ('cef49d49-868a-5a09-835a-2603c1c703bc', 'JALON_ABIERTO', NULL, 'Jalón al pecho abierto', '0e791bdc-97a0-50c9-94a6-49c857ffb820', '2de89f39-0bd9-58ec-95b1-68635167630c', NULL, 'polea'),
    ('810907b6-a5ae-5c60-9632-52cee90ea452', 'DOMINADAS', NULL, 'Dominadas', '0e791bdc-97a0-50c9-94a6-49c857ffb820', '2de89f39-0bd9-58ec-95b1-68635167630c', NULL, 'peso corporal'),
    ('66c92e5b-6747-5015-9350-66a29846ad06', 'JALON_MAQUINA', NULL, 'Jalón en máquina', '0e791bdc-97a0-50c9-94a6-49c857ffb820', '2de89f39-0bd9-58ec-95b1-68635167630c', NULL, 'máquina'),
    ('9a65ff4f-7118-5cd4-84f3-e05d3d02b3a7', 'REMO_MANCUERNA', NULL, 'Remo con mancuerna a una mano', '0e791bdc-97a0-50c9-94a6-49c857ffb820', 'ba095112-8572-5e0b-85c6-5aec06cd0dd0', NULL, 'mancuernas'),
    ('68e0181c-7042-579f-ac5d-4262c84719e0', 'REMO_POLEA_CERRADO', NULL, 'Remo en polea baja con agarre cerrado', '0e791bdc-97a0-50c9-94a6-49c857ffb820', 'ba095112-8572-5e0b-85c6-5aec06cd0dd0', NULL, 'polea'),
    ('66a3d872-ad9b-5213-b9d1-a3b9912a7479', 'JALON_CERRADO_SUPINO', NULL, 'Jalón con agarre cerrado supino', '0e791bdc-97a0-50c9-94a6-49c857ffb820', 'ba095112-8572-5e0b-85c6-5aec06cd0dd0', NULL, 'polea'),
    ('b196ca9d-b5cc-578e-bdb8-090f3493e1e8', 'PULLOVER_POLEA', NULL, 'Pullover en polea', '0e791bdc-97a0-50c9-94a6-49c857ffb820', 'ba095112-8572-5e0b-85c6-5aec06cd0dd0', 'ESTIRADO', 'polea'),
    ('f5c9f07d-bce0-53e5-b775-5ef56df4a1a3', 'PRESS_BANCA', NULL, 'Press de banca con barra', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', '556a7df8-f807-556e-9077-b888c95a41bf', NULL, 'barra'),
    ('2533db60-57da-592b-9f87-15f1376fe4f8', 'PRESS_INCLINADO_MANCUERNAS', NULL, 'Press inclinado con mancuernas', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', '556a7df8-f807-556e-9077-b888c95a41bf', NULL, 'mancuernas'),
    ('a0100109-acca-505c-825a-5dfe991e7cfc', 'PRESS_PECHO_MAQUINA', NULL, 'Press de pecho en máquina', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', '556a7df8-f807-556e-9077-b888c95a41bf', NULL, 'máquina'),
    ('fca0719b-5c75-5818-bafe-e9d979aa0653', 'APERTURAS_MANCUERNAS', NULL, 'Aperturas con mancuernas', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', '556a7df8-f807-556e-9077-b888c95a41bf', 'ESTIRADO', 'mancuernas'),
    ('7d6d51bf-7edf-5f16-bbce-3148f140bed6', 'PEC_DECK', NULL, 'Contractora (pec deck)', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', '556a7df8-f807-556e-9077-b888c95a41bf', NULL, 'máquina'),
    ('12707f62-6913-524a-a3d8-8e2d28d595db', 'CRUCE_POLEAS', NULL, 'Cruce de poleas', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', '556a7df8-f807-556e-9077-b888c95a41bf', NULL, 'polea'),
    ('c44712fb-fdae-54c3-92eb-42a94e4dffb5', 'REMO_ABIERTO_BARRA', NULL, 'Remo con barra y brazos abiertos', '5974ac73-cb12-50d4-a881-2dec8279e042', '678ba349-d307-5c4e-b492-02dc920c3bef', NULL, 'barra'),
    ('56d84454-3878-5827-84cd-cba8688f522f', 'REMO_ABIERTO_MAQUINA', NULL, 'Remo abierto en máquina', '5974ac73-cb12-50d4-a881-2dec8279e042', '678ba349-d307-5c4e-b492-02dc920c3bef', NULL, 'máquina'),
    ('8f0407e7-d654-5eb4-9d19-474366af3a9b', 'FACE_PULL', NULL, 'Face pull', '1a7a85c4-d1d0-5521-95c5-ed7bf45cba3a', '678ba349-d307-5c4e-b492-02dc920c3bef', NULL, 'polea'),
    ('640a9175-21c7-5570-8320-78f6a59e9f95', 'PAJAROS_MAQUINA', NULL, 'Deltoides posterior en máquina (pájaros)', '1a7a85c4-d1d0-5521-95c5-ed7bf45cba3a', '678ba349-d307-5c4e-b492-02dc920c3bef', NULL, 'máquina'),
    ('b3f2c2ec-202e-5380-aad6-2f0a31be3cf1', 'CURL_FEMORAL_SENTADO', NULL, 'Curl femoral sentado', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', '45fa5585-0eba-5c31-8766-46ff88282f17', 'ESTIRADO', 'máquina'),
    ('d1a5d096-3cf2-5ca9-8b4b-7481ac606a4e', 'CURL_FEMORAL_TUMBADO', NULL, 'Curl femoral tumbado', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', '45fa5585-0eba-5c31-8766-46ff88282f17', 'ACORTADO', 'máquina'),
    ('222502de-2303-52e7-ba9c-23faaeba94f6', 'CURL_NORDICO', NULL, 'Curl nórdico', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', '45fa5585-0eba-5c31-8766-46ff88282f17', NULL, 'peso corporal'),
    ('cb5996bd-6523-5eb5-ac48-c1d075330f08', 'EXTENSION_RODILLA_MAQUINA', NULL, 'Extensión de rodilla en máquina', '5e5c16cd-a7ce-5c2b-960f-7e56386a3a66', '720c6ca9-b985-5f80-89aa-570025350fd2', NULL, 'máquina'),
    ('a2fbb67a-ec17-5655-a20f-cba3dc237657', 'SENTADILLA_BARRA', NULL, 'Sentadilla con barra', '5e5c16cd-a7ce-5c2b-960f-7e56386a3a66', '720c6ca9-b985-5f80-89aa-570025350fd2', NULL, 'barra'),
    ('b7c16747-4220-5649-aa6f-9dbf467a9d3c', 'SENTADILLA_HACK', NULL, 'Sentadilla hack', '5e5c16cd-a7ce-5c2b-960f-7e56386a3a66', '720c6ca9-b985-5f80-89aa-570025350fd2', NULL, 'máquina'),
    ('2134cd92-8cc4-565b-9c1c-e33bf82e9099', 'PRENSA', NULL, 'Prensa de piernas', '5e5c16cd-a7ce-5c2b-960f-7e56386a3a66', '720c6ca9-b985-5f80-89aa-570025350fd2', NULL, 'máquina'),
    ('a34340dd-e80e-5dd3-891f-b294a18f0530', 'SENTADILLA_BULGARA', NULL, 'Sentadilla búlgara', '5e5c16cd-a7ce-5c2b-960f-7e56386a3a66', '720c6ca9-b985-5f80-89aa-570025350fd2', NULL, 'mancuernas'),
    ('22b8acf9-430e-5b0b-ba9c-2e689e7f4562', 'PESO_MUERTO_RUMANO', NULL, 'Peso muerto rumano', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', 'b8f3da07-6171-57ae-be72-f6872fa0c499', 'ESTIRADO', 'barra'),
    ('a2e457f4-831a-5633-b114-d45bfa7b31bb', 'PESO_MUERTO', NULL, 'Peso muerto convencional', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 'b8f3da07-6171-57ae-be72-f6872fa0c499', NULL, 'barra'),
    ('96c41dcf-bf8d-5fbe-89b1-80b9daa29dcd', 'HIP_THRUST', NULL, 'Hip thrust', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 'b8f3da07-6171-57ae-be72-f6872fa0c499', 'ACORTADO', 'barra'),
    ('72c2c57c-707f-5219-9f71-7aae09599fd5', 'HIPEREXTENSION_45', NULL, 'Hiperextensión en banco de 45°', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 'b8f3da07-6171-57ae-be72-f6872fa0c499', NULL, 'peso corporal'),
    ('76e3d609-c6b8-5ab9-b1e0-e44d10c61dab', 'ELEVACION_PIERNAS_COLGADO', NULL, 'Elevación de piernas colgado', 'cade82a6-2430-5ddb-80a1-a303f627d9b4', 'da4c70c5-d4ca-5753-aa3b-69a71d9c531e', NULL, 'peso corporal'),
    ('875f60b7-5992-57d6-a715-a134cd253e9a', 'FLEXION_CADERA_POLEA', NULL, 'Flexión de cadera en polea', 'cade82a6-2430-5ddb-80a1-a303f627d9b4', 'da4c70c5-d4ca-5753-aa3b-69a71d9c531e', NULL, 'polea'),
    ('1ad6b4ac-10a9-5a43-8cec-e61a95d463e6', 'CRUNCH', NULL, 'Crunch abdominal', '7b393e99-f686-5c54-ba69-61d310ffded4', '32ace286-7ab4-5d4b-b9f7-f6b173bf9f5e', NULL, 'peso corporal'),
    ('a8868e96-cca7-5433-a3c6-bd1d2224c943', 'CRUNCH_POLEA', NULL, 'Crunch en polea', '7b393e99-f686-5c54-ba69-61d310ffded4', '32ace286-7ab4-5d4b-b9f7-f6b173bf9f5e', NULL, 'polea'),
    ('6c86292a-0381-5c82-963d-4ec29402c139', 'CRUNCH_MAQUINA', NULL, 'Crunch en máquina', '7b393e99-f686-5c54-ba69-61d310ffded4', '32ace286-7ab4-5d4b-b9f7-f6b173bf9f5e', NULL, 'máquina'),
    ('2ef4ae47-2bae-5fc0-a5a9-93e3aec21016', 'EXTENSION_LUMBAR_MAQUINA', NULL, 'Extensión lumbar en máquina', 'e17065d3-086c-53b6-bf5d-74b981c09ab9', 'd0669fa1-0446-50b5-a1aa-778a3808d05a', NULL, 'máquina'),
    ('2c769639-6fc2-53ea-8c59-50ec9a7c17bb', 'EXTENSION_LUMBAR_45', NULL, 'Extensión lumbar en banco de 45° (espalda redondeada)', 'e17065d3-086c-53b6-bf5d-74b981c09ab9', 'd0669fa1-0446-50b5-a1aa-778a3808d05a', NULL, 'peso corporal'),
    ('1961f5b4-08e0-5b79-998d-b704d91d02d9', 'GEMELOS_DE_PIE', NULL, 'Elevación de talones de pie', '9b76624c-2a00-576a-b074-dca401905b79', 'b2572f3c-17f1-5a73-b1ce-dcf1c07e4572', NULL, 'máquina'),
    ('e893fc49-0bdf-5283-bb80-f04f3d1eb657', 'GEMELOS_SENTADO', NULL, 'Elevación de talones sentado', '447ecbdd-9b9e-589f-9aeb-78127c5dadf5', 'b2572f3c-17f1-5a73-b1ce-dcf1c07e4572', NULL, 'máquina');
