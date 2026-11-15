package com.gymapp.backend.cuenta;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Cuerpos de petición y respuesta de la API de cuentas. */
public final class AuthDtos {

    private static final String UUID = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

    private AuthDtos() {
    }

    /**
     * @param id UUID opcional generado en el teléfono, para conservar lo que ya registró sin cuenta.
     */
    public record RegistroRequest(
            @Pattern(regexp = UUID, message = "El id no es un UUID válido") String id,
            @NotBlank(message = "Escribe tu nombre") @Size(max = 100, message = "El nombre es demasiado largo") String nombre,
            @NotBlank(message = "Escribe tu correo") @Email(message = "El correo no es válido") @Size(max = 255) String email,
            @NotBlank(message = "Escribe una contraseña")
            @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres") String password,
            Nivel nivel) {

        /** El autocompletado del teléfono suele añadir espacios: se quitan antes de validar. */
        public RegistroRequest {
            email = email == null ? null : email.trim();
        }
    }

    public record LoginRequest(
            @NotBlank(message = "Escribe tu correo") String email,
            @NotBlank(message = "Escribe tu contraseña") String password) {

        public LoginRequest {
            email = email == null ? null : email.trim();
        }
    }

    /**
     * @param idToken token que Google entrega a la app al iniciar sesión.
     * @param id      UUID opcional del teléfono (solo se usa si la cuenta es nueva).
     * @param nivel   nivel elegido (solo se usa si la cuenta es nueva).
     */
    public record GoogleRequest(
            @NotBlank(message = "Falta el token de Google") String idToken,
            @Pattern(regexp = UUID, message = "El id no es un UUID válido") String id,
            Nivel nivel) {
    }

    public record VincularGoogleRequest(@NotBlank(message = "Falta el token de Google") String idToken) {
    }

    public record UsuarioDto(String id, String nombre, String email, Nivel nivel,
            boolean tienePassword, boolean vinculadoGoogle) {

        static UsuarioDto de(Usuario u) {
            return new UsuarioDto(u.getId(), u.getNombre(), u.getEmail(), u.getNivel(),
                    u.getPasswordHash() != null, u.getGoogleSub() != null);
        }
    }

    /** @param nueva true si la cuenta se acaba de crear (útil tras entrar con Google). */
    public record AuthResponse(String token, UsuarioDto usuario, boolean nueva) {
    }
}
