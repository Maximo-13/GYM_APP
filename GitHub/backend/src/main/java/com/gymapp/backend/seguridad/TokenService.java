package com.gymapp.backend.seguridad;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.gymapp.backend.cuenta.Usuario;

/**
 * Emite nuestros tokens de sesión (JWT firmados con HS256).
 * El subject es el id del usuario; la app lo envía en cada petición como
 * "Authorization: Bearer ...".
 */
@Service
public class TokenService {

    public static final String EMISOR = "gymapp";

    private final JwtEncoder encoder;
    private final Duration duracion;

    public TokenService(JwtEncoder encoder, @Value("${gymapp.jwt.dias:30}") long dias) {
        this.encoder = encoder;
        this.duracion = Duration.ofDays(dias);
    }

    public String emitir(Usuario usuario) {
        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(EMISOR)
                .subject(usuario.getId())
                .issuedAt(ahora)
                .expiresAt(ahora.plus(duracion))
                .claim("email", usuario.getEmail())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
