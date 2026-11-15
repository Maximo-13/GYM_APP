package com.gymapp.backend.cuenta;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.gymapp.backend.cuenta.AuthDtos.AuthResponse;
import com.gymapp.backend.cuenta.AuthDtos.GoogleRequest;
import com.gymapp.backend.cuenta.AuthDtos.LoginRequest;
import com.gymapp.backend.cuenta.AuthDtos.PerfilRequest;
import com.gymapp.backend.cuenta.AuthDtos.RegistroRequest;
import com.gymapp.backend.cuenta.AuthDtos.UsuarioDto;
import com.gymapp.backend.cuenta.AuthDtos.VincularGoogleRequest;

import jakarta.validation.Valid;

/**
 * API de cuentas.
 * <ul>
 * <li>POST /api/auth/registro — crear cuenta con correo y contraseña</li>
 * <li>POST /api/auth/login — iniciar sesión con correo y contraseña</li>
 * <li>POST /api/auth/google — entrar (o crear cuenta) con Google</li>
 * <li>GET /api/cuenta — datos de la cuenta con la sesión iniciada</li>
 * <li>PUT /api/cuenta/perfil — cambiar nombre, nivel, peso, objetivo y días por semana</li>
 * <li>DELETE /api/cuenta — borrar la cuenta</li>
 * <li>POST /api/cuenta/google — vincular Google a la cuenta con la sesión iniciada</li>
 * </ul>
 */
@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/auth/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registrar(@Valid @RequestBody RegistroRequest req) {
        return auth.registrar(req);
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @PostMapping("/auth/google")
    public AuthResponse google(@Valid @RequestBody GoogleRequest req) {
        return auth.google(req);
    }

    @GetMapping("/cuenta")
    public UsuarioDto yo(@AuthenticationPrincipal Jwt jwt) {
        return auth.yo(jwt.getSubject());
    }

    @PutMapping("/cuenta/perfil")
    public UsuarioDto actualizarPerfil(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PerfilRequest req) {
        return auth.actualizarPerfil(jwt.getSubject(), req);
    }

    @DeleteMapping("/cuenta")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void borrar(@AuthenticationPrincipal Jwt jwt) {
        auth.borrar(jwt.getSubject());
    }

    @PostMapping("/cuenta/google")
    public UsuarioDto vincularGoogle(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody VincularGoogleRequest req) {
        return auth.vincularGoogle(jwt.getSubject(), req.idToken());
    }
}
