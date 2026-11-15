package com.gymapp.backend.cuenta;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

/**
 * Pruebas de la API de cuentas contra la base gym_app de MySQL.
 * Cada prueba se deshace al terminar (@Transactional), así no deja usuarios.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    private static final String ID_TELEFONO = "0b5f2a4e-1c3d-4e5f-8a9b-0c1d2e3f4a5b";

    @Autowired
    MockMvc mvc;

    @Autowired
    UsuarioRepository usuarios;

    private String registro(String email, String password) {
        return """
                {"id":"%s","nombre":"Ana","email":"%s","password":"%s","nivel":"INTERMEDIO"}
                """.formatted(ID_TELEFONO, email, password);
    }

    private String json(String email, String password) {
        return """
                {"email":"%s","password":"%s"}
                """.formatted(email, password);
    }

    @Test
    void registraLaCuentaConElIdDelTelefonoYContrasenaCifrada() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(registro("  Ana@Correo.com ", "secreta123")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.nueva").value(true))
                .andExpect(jsonPath("$.usuario.id").value(ID_TELEFONO))
                .andExpect(jsonPath("$.usuario.email").value("ana@correo.com"))
                .andExpect(jsonPath("$.usuario.nivel").value("INTERMEDIO"))
                .andExpect(jsonPath("$.usuario.tienePassword").value(true));

        Usuario guardado = usuarios.findById(ID_TELEFONO).orElseThrow();
        assertThat(guardado.getPasswordHash()).startsWith("$2").doesNotContain("secreta123");
    }

    @Test
    void noPermiteDosCuentasConElMismoCorreo() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(registro("ana@correo.com", "secreta123"))).andExpect(status().isCreated());
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(registro("ANA@correo.com", "otra12345")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value("Ya existe una cuenta con ese correo"));
    }

    @Test
    void validaCorreoYLongitudDeContrasena() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(registro("no-es-correo", "secreta123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("El correo no es válido"));
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(registro("ana@correo.com", "corta")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("La contraseña debe tener entre 8 y 72 caracteres"));
    }

    @Test
    void iniciaSesionYElTokenDaAccesoALaCuenta() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(registro("ana@correo.com", "secreta123"))).andExpect(status().isCreated());

        String respuesta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json("Ana@Correo.com", "secreta123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nueva").value(false))
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(respuesta, "$.token");

        mvc.perform(get("/api/cuenta").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ana@correo.com"))
                .andExpect(jsonPath("$.vinculadoGoogle").value(false));
    }

    @Test
    void rechazaContrasenaIncorrectaYCorreoInexistenteConElMismoMensaje() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(registro("ana@correo.com", "secreta123"))).andExpect(status().isCreated());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json("ana@correo.com", "equivocada")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Correo o contraseña incorrectos"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json("nadie@correo.com", "secreta123")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Correo o contraseña incorrectos"));
    }

    @Test
    void sinTokenOConTokenFalsoNoHayAcceso() throws Exception {
        mvc.perform(get("/api/cuenta")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/cuenta").header("Authorization", "Bearer inventado.token.falso"))
                .andExpect(status().isUnauthorized());
    }

    private String tokenDeCuentaNueva() throws Exception {
        String respuesta = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(registro("ana@correo.com", "secreta123")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(respuesta, "$.token");
    }

    @Test
    void actualizaNivelYDatosOpcionalesDelPerfil() throws Exception {
        String token = tokenDeCuentaNueva();
        mvc.perform(put("/api/cuenta/perfil").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nombre":" Ana María ","nivel":"AVANZADO","pesoCorporalKg":72.5,
                         "objetivo":"Ganar músculo","diasPorSemana":4}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Ana María"))
                .andExpect(jsonPath("$.nivel").value("AVANZADO"))
                .andExpect(jsonPath("$.pesoCorporalKg").value(72.5))
                .andExpect(jsonPath("$.objetivo").value("Ganar músculo"))
                .andExpect(jsonPath("$.diasPorSemana").value(4));

        // Los opcionales en null quedan vacíos
        mvc.perform(put("/api/cuenta/perfil").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Ana\",\"nivel\":\"AVANZADO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pesoCorporalKg").doesNotExist())
                .andExpect(jsonPath("$.diasPorSemana").doesNotExist());
    }

    @Test
    void validaLosDatosDelPerfil() throws Exception {
        String token = tokenDeCuentaNueva();
        mvc.perform(put("/api/cuenta/perfil").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Ana\",\"nivel\":\"AVANZADO\",\"diasPorSemana\":9}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("Los días por semana deben estar entre 1 y 7"));
        mvc.perform(put("/api/cuenta/perfil").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Ana\",\"nivel\":\"AVANZADO\",\"pesoCorporalKg\":5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("El peso debe estar entre 20 y 400 kg"));
    }

    @Test
    void borrarLaCuentaQuitaElAccesoYLiberaElCorreo() throws Exception {
        String token = tokenDeCuentaNueva();
        mvc.perform(delete("/api/cuenta").header("Authorization", token)).andExpect(status().isNoContent());

        mvc.perform(get("/api/cuenta").header("Authorization", token)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json("ana@correo.com", "secreta123")))
                .andExpect(status().isUnauthorized());

        Usuario borrada = usuarios.findById(ID_TELEFONO).orElseThrow();
        assertThat(borrada.getEmail()).doesNotContain("ana@correo.com");
        assertThat(borrada.getPasswordHash()).isNull();

        // El mismo correo puede volver a registrarse (con otro id)
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(registro("ana@correo.com", "nueva12345")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario.id").value(org.hamcrest.Matchers.not(ID_TELEFONO)));
    }

    @Test
    void googleSinConfigurarRespondeQueNoEstaDisponible() throws Exception {
        mvc.perform(post("/api/auth/google").contentType(MediaType.APPLICATION_JSON)
                .content("{\"idToken\":\"cualquiera\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.mensaje").value("El inicio de sesión con Google todavía no está configurado"));
    }
}
