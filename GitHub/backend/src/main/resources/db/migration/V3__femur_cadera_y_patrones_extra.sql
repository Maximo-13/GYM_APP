-- =====================================================================
-- V3: matiz entre movimientos del fémur y de la cadera (bisagra),
--     pecho superior y patrones que faltaban para registrar.
--
--   * Extensión / flexión de FÉMUR: la pelvis queda fija y se mueve el muslo
--     (patada de glúteo, elevación de piernas).
--   * Extensión / flexión de CADERA (bisagra): el fémur queda fijo y se
--     mueven la pelvis y el tronco sobre él (peso muerto rumano, sit-up).
-- =====================================================================

INSERT INTO musculo (id, codigo, nombre, region) VALUES
    ('bcf4b0cb-3519-569a-bc78-b587fc04e12b', 'PECTORAL_SUPERIOR', 'Pectoral mayor, porción clavicular (pecho superior)', 'TREN_SUPERIOR'),
    ('5a355b44-9c6f-52b0-91f5-5b453f3dcf9c', 'GLUTEO_MEDIO', 'Glúteo medio', 'TREN_INFERIOR');

UPDATE patron_articular SET
    nombre = 'Extensión de cadera (bisagra)',
    descripcion_simple = 'Con los pies fijos y las piernas casi quietas, enderezas el tronco desde la cadera, como una bisagra que se cierra hacia arriba.',
    descripcion_tecnica = 'La pelvis y el tronco rotan sobre un fémur fijo (movimiento pélvico-femoral), como en el peso muerto rumano. Motores principales: glúteo mayor e isquiotibiales; los erectores espinales sostienen la columna.'
  WHERE codigo = 'EXTENSION_CADERA';

UPDATE patron_articular SET
    nombre = 'Flexión de cadera (bisagra)',
    descripcion_simple = 'Con las piernas fijas, llevas el tronco hacia los muslos doblándote desde la cadera.',
    descripcion_tecnica = 'La pelvis y el tronco rotan hacia delante sobre un fémur fijo, como en el sit-up. Motor principal: iliopsoas; el recto abdominal flexiona además la columna.'
  WHERE codigo = 'FLEXION_CADERA';

INSERT INTO patron_articular (id, codigo, nombre, articulacion, plano, descripcion_simple, descripcion_tecnica, orden) VALUES
    ('8a5b24eb-4ff1-5cc9-b222-8b7f9f8e188f', 'EXTENSION_FEMUR', 'Extensión de fémur', 'cadera', 'SAGITAL',
     'Con el tronco fijo, llevas el muslo hacia atrás.',
     'El fémur rota hacia atrás sobre una pelvis fija (movimiento fémoro-pélvico), como en la patada de glúteo. Motor principal: glúteo mayor; los isquiotibiales ayudan más cuanto más estirada está la rodilla.', 0),
    ('b912367f-9c40-55e7-8115-f90d3409f205', 'FLEXION_FEMUR', 'Flexión de fémur', 'cadera', 'SAGITAL',
     'Con el tronco fijo, subes el muslo hacia delante.',
     'El fémur rota hacia delante sobre una pelvis fija, como en la elevación de piernas colgado. Motor principal: iliopsoas, con el recto femoral.', 0),
    ('42452948-8bf3-5473-89bc-095826d3db59', 'ABDUCCION_CADERA', 'Abducción de cadera', 'cadera', 'FRONTAL',
     'Separas la pierna hacia el costado, alejándola de la otra.',
     'El fémur se aleja de la línea media en el plano frontal, como en la máquina abductora. Motor principal: glúteo medio.', 0),
    ('d03b2bf0-21f3-580e-bda1-d25694e221e3', 'ADUCCION_CADERA', 'Aducción de cadera', 'cadera', 'FRONTAL',
     'Juntas la pierna hacia la otra.',
     'El fémur se acerca a la línea media en el plano frontal, como en la máquina aductora. Motores principales: aductores.', 0),
    ('73b127d2-1977-5871-bb36-22aaf96770b8', 'ELEVACION_ESCAPULAR', 'Elevación escapular', 'escápula', NULL,
     'Subes los hombros hacia las orejas, como encogiéndote.',
     'Las escápulas se elevan sobre el tórax, como en los encogimientos. Motor principal: trapecio superior.', 0);

UPDATE patron_articular SET orden = 1 WHERE codigo = 'FLEXION_CODO';
UPDATE patron_articular SET orden = 2 WHERE codigo = 'EXTENSION_CODO';
UPDATE patron_articular SET orden = 3 WHERE codigo = 'FLEXION_HOMBRO';
UPDATE patron_articular SET orden = 4 WHERE codigo = 'EXTENSION_HOMBRO';
UPDATE patron_articular SET orden = 5 WHERE codigo = 'ABDUCCION_HOMBRO';
UPDATE patron_articular SET orden = 6 WHERE codigo = 'ADUCCION_HOMBRO';
UPDATE patron_articular SET orden = 7 WHERE codigo = 'ADUCCION_HORIZONTAL_HOMBRO';
UPDATE patron_articular SET orden = 8 WHERE codigo = 'EXTENSION_HORIZONTAL_HOMBRO';
UPDATE patron_articular SET orden = 9 WHERE codigo = 'ELEVACION_ESCAPULAR';
UPDATE patron_articular SET orden = 10 WHERE codigo = 'FLEXION_COLUMNA';
UPDATE patron_articular SET orden = 11 WHERE codigo = 'EXTENSION_COLUMNA';
UPDATE patron_articular SET orden = 12 WHERE codigo = 'FLEXION_FEMUR';
UPDATE patron_articular SET orden = 13 WHERE codigo = 'EXTENSION_FEMUR';
UPDATE patron_articular SET orden = 14 WHERE codigo = 'FLEXION_CADERA';
UPDATE patron_articular SET orden = 15 WHERE codigo = 'EXTENSION_CADERA';
UPDATE patron_articular SET orden = 16 WHERE codigo = 'ABDUCCION_CADERA';
UPDATE patron_articular SET orden = 17 WHERE codigo = 'ADUCCION_CADERA';
UPDATE patron_articular SET orden = 18 WHERE codigo = 'FLEXION_RODILLA';
UPDATE patron_articular SET orden = 19 WHERE codigo = 'EXTENSION_RODILLA';
UPDATE patron_articular SET orden = 20 WHERE codigo = 'FLEXION_PLANTAR';

-- Flexión de hombro: el pecho superior pasa a nombrarse por su porción
UPDATE patron_musculo SET musculo_id = 'bcf4b0cb-3519-569a-bc78-b587fc04e12b'
  WHERE patron_articular_id = 'f9ad45d3-74c2-5fa3-bc87-8485fbdfcec9' AND musculo_id = '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc';

-- Extensión de hombro desde flexión elevada (pullover): pecho (porción esternal) y tríceps ayudan
INSERT INTO patron_musculo (patron_articular_id, musculo_id, rol) VALUES
    ('ba095112-8572-5e0b-85c6-5aec06cd0dd0', '1e0a4413-a9f1-5d42-b802-170ca8f0d7bc', 'SECUNDARIO'),
    ('556a7df8-f807-556e-9077-b888c95a41bf', 'bcf4b0cb-3519-569a-bc78-b587fc04e12b', 'SECUNDARIO'),
    ('b8f3da07-6171-57ae-be72-f6872fa0c499', 'e17065d3-086c-53b6-bf5d-74b981c09ab9', 'SECUNDARIO'),
    ('da4c70c5-d4ca-5753-aa3b-69a71d9c531e', '7b393e99-f686-5c54-ba69-61d310ffded4', 'SECUNDARIO'),
    ('8a5b24eb-4ff1-5cc9-b222-8b7f9f8e188f', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', 'PRINCIPAL'),
    ('8a5b24eb-4ff1-5cc9-b222-8b7f9f8e188f', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', 'SECUNDARIO'),
    ('b912367f-9c40-55e7-8115-f90d3409f205', 'cade82a6-2430-5ddb-80a1-a303f627d9b4', 'PRINCIPAL'),
    ('b912367f-9c40-55e7-8115-f90d3409f205', '5e5c16cd-a7ce-5c2b-960f-7e56386a3a66', 'SECUNDARIO'),
    ('42452948-8bf3-5473-89bc-095826d3db59', '5a355b44-9c6f-52b0-91f5-5b453f3dcf9c', 'PRINCIPAL'),
    ('d03b2bf0-21f3-580e-bda1-d25694e221e3', '100355b3-693f-5e0f-bf9c-1e1a63836535', 'PRINCIPAL'),
    ('73b127d2-1977-5871-bb36-22aaf96770b8', '5974ac73-cb12-50d4-a881-2dec8279e042', 'PRINCIPAL');

-- La flexión de cadera (bisagra) ya no lista el cuádriceps: eso es del fémur
DELETE FROM patron_musculo
  WHERE patron_articular_id = 'da4c70c5-d4ca-5753-aa3b-69a71d9c531e' AND musculo_id = '5e5c16cd-a7ce-5c2b-960f-7e56386a3a66';

UPDATE ejercicio SET patron_articular_id = '8a5b24eb-4ff1-5cc9-b222-8b7f9f8e188f' WHERE codigo = 'HIP_THRUST';
UPDATE ejercicio SET patron_articular_id = 'b912367f-9c40-55e7-8115-f90d3409f205' WHERE codigo IN ('ELEVACION_PIERNAS_COLGADO', 'FLEXION_CADERA_POLEA');
UPDATE ejercicio SET nombre = 'Flexión de fémur en polea' WHERE codigo = 'FLEXION_CADERA_POLEA';
UPDATE ejercicio SET musculo_id = 'bcf4b0cb-3519-569a-bc78-b587fc04e12b' WHERE codigo = 'PRESS_INCLINADO_MANCUERNAS';

INSERT INTO ejercicio (id, codigo, usuario_id, nombre, musculo_id, patron_articular_id, enfasis, equipo) VALUES
    ('57f685f0-a3c5-54eb-94ab-e3805e27d518', 'PATADA_GLUTEO_POLEA', NULL, 'Patada de glúteo en polea', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', '8a5b24eb-4ff1-5cc9-b222-8b7f9f8e188f', NULL, 'polea'),
    ('b96308d7-eb3e-54a1-b0b4-0e4425b29bbb', 'PATADA_GLUTEO_MAQUINA', NULL, 'Patada de glúteo en máquina', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', '8a5b24eb-4ff1-5cc9-b222-8b7f9f8e188f', NULL, 'máquina'),
    ('046172a4-e50b-5d8b-936a-8a00e0055799', 'HIPEREXTENSION_INVERSA', NULL, 'Hiperextensión inversa', 'f6e7694e-4db6-5ef7-b91d-45fd1a278843', '8a5b24eb-4ff1-5cc9-b222-8b7f9f8e188f', NULL, 'máquina'),
    ('fbe0ba02-1ff0-59c1-8794-3e3487ab3367', 'BUENOS_DIAS', NULL, 'Buenos días', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', 'b8f3da07-6171-57ae-be72-f6872fa0c499', 'ESTIRADO', 'barra'),
    ('d90e893f-1f00-5d09-b0f7-253db0c98d8e', 'PESO_MUERTO_RUMANO_MANCUERNAS', NULL, 'Peso muerto rumano con mancuernas', '039a70e9-6bf9-5e07-913d-3f1bb49990ad', 'b8f3da07-6171-57ae-be72-f6872fa0c499', 'ESTIRADO', 'mancuernas'),
    ('42a75118-de9a-5e95-a2e4-04aaee3f19b7', 'ELEVACION_RODILLAS_PARALELAS', NULL, 'Elevación de rodillas en paralelas', 'cade82a6-2430-5ddb-80a1-a303f627d9b4', 'b912367f-9c40-55e7-8115-f90d3409f205', NULL, 'peso corporal'),
    ('9945041c-67a9-59ce-a5aa-8b0295b7f6f8', 'SIT_UP_DECLINADO', NULL, 'Sit-up en banco declinado', 'cade82a6-2430-5ddb-80a1-a303f627d9b4', 'da4c70c5-d4ca-5753-aa3b-69a71d9c531e', NULL, 'peso corporal'),
    ('f22f9f96-92b2-57d2-b550-bf7fe8f0bdb6', 'PRESS_INCLINADO_BARRA', NULL, 'Press inclinado con barra', 'bcf4b0cb-3519-569a-bc78-b587fc04e12b', '556a7df8-f807-556e-9077-b888c95a41bf', NULL, 'barra'),
    ('9bd728cd-cd8d-5e2e-9c68-c91abd3cc1c3', 'CRUCE_POLEAS_BAJO', NULL, 'Cruce de poleas de abajo hacia arriba', 'bcf4b0cb-3519-569a-bc78-b587fc04e12b', 'f9ad45d3-74c2-5fa3-bc87-8485fbdfcec9', NULL, 'polea'),
    ('13bbc605-77d6-5fb3-8a0b-956363f381af', 'ABDUCTORA', NULL, 'Máquina abductora', '5a355b44-9c6f-52b0-91f5-5b453f3dcf9c', '42452948-8bf3-5473-89bc-095826d3db59', NULL, 'máquina'),
    ('d0e8f175-b9e6-5e60-92d2-90c779418b43', 'ABDUCCION_POLEA', NULL, 'Abducción de cadera en polea', '5a355b44-9c6f-52b0-91f5-5b453f3dcf9c', '42452948-8bf3-5473-89bc-095826d3db59', NULL, 'polea'),
    ('f4a92033-367e-58da-870b-40566d631ae0', 'ADUCTORA', NULL, 'Máquina aductora', '100355b3-693f-5e0f-bf9c-1e1a63836535', 'd03b2bf0-21f3-580e-bda1-d25694e221e3', NULL, 'máquina'),
    ('deec733f-605c-5329-a0ca-2702f7b60809', 'ENCOGIMIENTOS_MANCUERNAS', NULL, 'Encogimientos con mancuernas', '5974ac73-cb12-50d4-a881-2dec8279e042', '73b127d2-1977-5871-bb36-22aaf96770b8', NULL, 'mancuernas'),
    ('d0b79818-f876-530e-8914-4ad66fb99507', 'ENCOGIMIENTOS_BARRA', NULL, 'Encogimientos con barra', '5974ac73-cb12-50d4-a881-2dec8279e042', '73b127d2-1977-5871-bb36-22aaf96770b8', NULL, 'barra');
