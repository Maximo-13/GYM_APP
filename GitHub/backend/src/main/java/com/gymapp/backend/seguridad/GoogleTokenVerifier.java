package com.gymapp.backend.seguridad;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import com.gymapp.backend.comun.ApiException;

/**
 * Comprueba el "ID token" que Google entrega a la app al iniciar sesión:
 * firma (claves públicas de Google), caducidad, emisor y que vaya dirigido
 * a uno de nuestros Client ID. Así nadie puede inventarse un token.
 */
@Component
public class GoogleTokenVerifier {

    private static final String CLAVES_GOOGLE = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> EMISORES = Set.of("accounts.google.com", "https://accounts.google.com");

    /** Datos de la persona que Google confirma. */
    public record IdentidadGoogle(String sub, String email, boolean emailVerificado, String nombre) {
    }

    private final List<String> clientIds;
    private final NimbusJwtDecoder decoder;

    public GoogleTokenVerifier(@Value("${gymapp.google.client-ids:}") String clientIds) {
        this.clientIds = Arrays.stream(clientIds.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        this.decoder = NimbusJwtDecoder.withJwkSetUri(CLAVES_GOOGLE).build();
        this.decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefault(),
                jwt -> EMISORES.contains(jwt.getClaimAsString("iss"))
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Emisor no válido", null)),
                jwt -> jwt.getAudience().stream().anyMatch(this.clientIds::contains)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Audiencia no válida", null))));
    }

    public boolean configurado() {
        return !clientIds.isEmpty();
    }

    public IdentidadGoogle verificar(String idToken) {
        if (!configurado()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "El inicio de sesión con Google todavía no está configurado");
        }
        try {
            Jwt jwt = decoder.decode(idToken);
            Boolean verificado = jwt.getClaimAsBoolean("email_verified");
            return new IdentidadGoogle(jwt.getSubject(), jwt.getClaimAsString("email"),
                    Boolean.TRUE.equals(verificado), jwt.getClaimAsString("name"));
        } catch (JwtException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "No se pudo verificar tu cuenta de Google");
        }
    }
}
