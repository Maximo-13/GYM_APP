package com.gymapp.backend.cuenta;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gymapp.backend.comun.ApiException;
import com.gymapp.backend.cuenta.AuthDtos.AuthResponse;
import com.gymapp.backend.cuenta.AuthDtos.GoogleRequest;
import com.gymapp.backend.cuenta.AuthDtos.LoginRequest;
import com.gymapp.backend.cuenta.AuthDtos.PerfilRequest;
import com.gymapp.backend.cuenta.AuthDtos.RegistroRequest;
import com.gymapp.backend.cuenta.AuthDtos.UsuarioDto;
import com.gymapp.backend.seguridad.GoogleTokenVerifier;
import com.gymapp.backend.seguridad.GoogleTokenVerifier.IdentidadGoogle;
import com.gymapp.backend.seguridad.TokenService;

/** Crear cuenta, iniciar sesión (correo o Google) y vincular Google a una cuenta existente (RF-01). */
@Service
public class AuthService {

    private static final String CREDENCIALES_INCORRECTAS = "Correo o contraseña incorrectos";

    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwords;
    private final TokenService tokens;
    private final GoogleTokenVerifier google;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder passwords, TokenService tokens,
            GoogleTokenVerifier google) {
        this.usuarios = usuarios;
        this.passwords = passwords;
        this.tokens = tokens;
        this.google = google;
    }

    @Transactional
    public AuthResponse registrar(RegistroRequest req) {
        String email = normalizar(req.email());
        if (usuarios.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo");
        }
        Usuario u = new Usuario(idParaCuentaNueva(req.id()), email, req.nombre().trim(),
                Optional.ofNullable(req.nivel()).orElse(Nivel.PRINCIPIANTE));
        u.setPasswordHash(passwords.encode(req.password()));
        usuarios.save(u);
        return respuesta(u, true);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        Usuario u = usuarios.findByEmailAndDeletedAtIsNull(normalizar(req.email()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, CREDENCIALES_INCORRECTAS));
        if (u.getPasswordHash() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED,
                    "Esta cuenta se creó con Google: entra con el botón de Google");
        }
        if (!passwords.matches(req.password(), u.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, CREDENCIALES_INCORRECTAS);
        }
        return respuesta(u, false);
    }

    /**
     * Entrar con Google: si esa cuenta de Google ya está vinculada, entra; si existe una
     * cuenta con el mismo correo (verificado por Google), la vincula; si no, crea una nueva.
     */
    @Transactional
    public AuthResponse google(GoogleRequest req) {
        IdentidadGoogle g = google.verificar(req.idToken());

        Optional<Usuario> vinculada = usuarios.findByGoogleSubAndDeletedAtIsNull(g.sub());
        if (vinculada.isPresent()) {
            return respuesta(vinculada.get(), false);
        }
        if (g.email() == null || !g.emailVerificado()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Tu cuenta de Google no tiene un correo verificado");
        }
        String email = normalizar(g.email());
        Optional<Usuario> porCorreo = usuarios.findByEmailAndDeletedAtIsNull(email);
        if (porCorreo.isPresent()) {
            Usuario u = porCorreo.get();
            u.setGoogleSub(g.sub());
            return respuesta(u, false);
        }
        String nombre = g.nombre() != null && !g.nombre().isBlank()
                ? g.nombre().trim()
                : email.substring(0, email.indexOf('@'));
        Usuario u = new Usuario(idParaCuentaNueva(req.id()), email, truncar(nombre, 100),
                Optional.ofNullable(req.nivel()).orElse(Nivel.PRINCIPIANTE));
        u.setGoogleSub(g.sub());
        usuarios.save(u);
        return respuesta(u, true);
    }

    /** Vincula Google a la cuenta con la que ya se inició sesión. */
    @Transactional
    public UsuarioDto vincularGoogle(String usuarioId, String idToken) {
        Usuario u = buscar(usuarioId);
        IdentidadGoogle g = google.verificar(idToken);
        usuarios.findByGoogleSubAndDeletedAtIsNull(g.sub())
                .filter(otra -> !otra.getId().equals(u.getId()))
                .ifPresent(otra -> {
                    throw new ApiException(HttpStatus.CONFLICT, "Esa cuenta de Google ya está vinculada a otro usuario");
                });
        u.setGoogleSub(g.sub());
        return UsuarioDto.de(u);
    }

    @Transactional(readOnly = true)
    public UsuarioDto yo(String usuarioId) {
        return UsuarioDto.de(buscar(usuarioId));
    }

    /** Nombre, nivel y datos opcionales: peso, objetivo y días por semana (RF-02, RF-03). */
    @Transactional
    public UsuarioDto actualizarPerfil(String usuarioId, PerfilRequest req) {
        Usuario u = buscar(usuarioId);
        u.setNombre(req.nombre());
        u.setNivel(req.nivel());
        u.setPesoCorporalKg(req.pesoCorporalKg());
        u.setObjetivo(req.objetivo());
        u.setDiasPorSemana(req.diasPorSemana() == null ? null : req.diasPorSemana().byteValue());
        return UsuarioDto.de(u);
    }

    /** Borra la cuenta: deja de poder entrar y sus datos personales se eliminan (RNF-07). */
    @Transactional
    public void borrar(String usuarioId) {
        buscar(usuarioId).borrar(LocalDateTime.now());
    }

    private Usuario buscar(String usuarioId) {
        return usuarios.findById(usuarioId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "La cuenta ya no existe"));
    }

    /** Usa el id del teléfono si es válido y está libre; si no, genera uno nuevo. */
    private String idParaCuentaNueva(String idTelefono) {
        if (idTelefono != null) {
            String id = idTelefono.toLowerCase(Locale.ROOT);
            if (!usuarios.existsById(id)) {
                return id;
            }
        }
        return UUID.randomUUID().toString();
    }

    private AuthResponse respuesta(Usuario u, boolean nueva) {
        return new AuthResponse(tokens.emitir(u), UsuarioDto.de(u), nueva);
    }

    private static String normalizar(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String truncar(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }
}
