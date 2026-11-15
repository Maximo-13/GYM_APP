-- =====================================================================
-- V5: cuentas vinculables con Google
--
--   * password_hash pasa a ser opcional: quien entra solo con Google no tiene
--     contraseña en nuestra base (puede crearla después).
--   * google_sub guarda el identificador estable que Google da a cada persona
--     ("sub" del token). El correo puede cambiar; el sub no.
-- =====================================================================

ALTER TABLE usuario
    MODIFY COLUMN password_hash VARCHAR(255) NULL,
    ADD COLUMN google_sub VARCHAR(255) NULL AFTER password_hash,
    ADD UNIQUE KEY uk_usuario_google_sub (google_sub);
