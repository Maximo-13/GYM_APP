package com.gymapp.backend.cuenta;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    /**
     * Datos editables del perfil (RF-02, RF-03). Se envían todos: un campo opcional
     * en null significa "sin dato".
     */
    public record PerfilRequest(
            @NotBlank(message = "Escribe tu nombre") @Size(max = 100, message = "El nombre es demasiado largo") String nombre,
            @NotNull(message = "Elige tu nivel") Nivel nivel,
            @DecimalMin(value = "20", message = "El peso debe estar entre 20 y 400 kg")
            @DecimalMax(value = "400", message = "El peso debe estar entre 20 y 400 kg")
            @Digits(integer = 3, fraction = 2, message = "El peso admite como máximo 2 decimales") BigDecimal pesoCorporalKg,
            @Size(max = 100, message = "El objetivo es demasiado largo") String objetivo,
            @Min(value = 1, message = "Los días por semana deben estar entre 1 y 7")
            @Max(value = 7, message = "Los días por semana deben estar entre 1 y 7") Integer diasPorSemana) {

        public PerfilRequest {
            nombre = nombre == null ? null : nombre.trim();
            objetivo = objetivo == null || objetivo.isBlank() ? null : objetivo.trim();
        }
    }

    public record UsuarioDto(String id, String nombre, String email, Nivel nivel,
            BigDecimal pesoCorporalKg, String objetivo, Integer diasPorSemana,
            boolean tienePassword, boolean vinculadoGoogle) {

        static UsuarioDto de(Usuario u) {
            return new UsuarioDto(u.getId(), u.getNombre(), u.getEmail(), u.getNivel(),
                    u.getPesoCorporalKg(), u.getObjetivo(),
                    u.getDiasPorSemana() == null ? null : u.getDiasPorSemana().intValue(),
                    u.getPasswordHash() != null, u.getGoogleSub() != null);
        }
    }

    /** @param nueva true si la cuenta se acaba de crear (útil tras entrar con Google). */
    public record AuthResponse(String token, UsuarioDto usuario, boolean nueva) {
    }
}
