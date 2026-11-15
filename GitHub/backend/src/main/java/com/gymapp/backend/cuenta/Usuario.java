package com.gymapp.backend.cuenta;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Cuenta de usuario (tabla usuario, migraciones V1 y V5).
 * El id es un UUID que puede generar el propio teléfono, para que los datos
 * registrados antes de crear la cuenta queden vinculados a ella.
 */
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String email;

    /** BCrypt. Null si la cuenta solo entra con Google. */
    @Column(name = "password_hash")
    private String passwordHash;

    /** Identificador estable de Google ("sub" del token). Null si no está vinculada. */
    @Column(name = "google_sub")
    private String googleSub;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.ENUM)
    @Column(nullable = false)
    private Nivel nivel = Nivel.PRINCIPIANTE;

    @Column(name = "peso_corporal_kg", precision = 5, scale = 2)
    private BigDecimal pesoCorporalKg;

    @Column(length = 100)
    private String objetivo;

    @Column(name = "dias_por_semana")
    private Byte diasPorSemana;

    @Column(nullable = false, length = 5)
    private String idioma = "es";

    /** Las pone MySQL (DEFAULT y ON UPDATE CURRENT_TIMESTAMP). */
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    protected Usuario() {
        // Para JPA
    }

    public Usuario(String id, String email, String nombre, Nivel nivel) {
        this.id = id;
        this.email = email;
        this.nombre = nombre;
        this.nivel = nivel;
    }

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getGoogleSub() { return googleSub; }
    public void setGoogleSub(String googleSub) { this.googleSub = googleSub; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public Nivel getNivel() { return nivel; }
    public void setNivel(Nivel nivel) { this.nivel = nivel; }
    public BigDecimal getPesoCorporalKg() { return pesoCorporalKg; }
    public void setPesoCorporalKg(BigDecimal pesoCorporalKg) { this.pesoCorporalKg = pesoCorporalKg; }
    public String getObjetivo() { return objetivo; }
    public void setObjetivo(String objetivo) { this.objetivo = objetivo; }
    public Byte getDiasPorSemana() { return diasPorSemana; }
    public void setDiasPorSemana(Byte diasPorSemana) { this.diasPorSemana = diasPorSemana; }

    /**
     * Borrado de cuenta (RNF-07): se marca como borrada y se quitan los datos que
     * identifican a la persona, liberando el correo para una cuenta futura.
     */
    public void borrar(LocalDateTime cuando) {
        this.deletedAt = cuando;
        this.email = "borrada+" + id + "@gymapp.invalid";
        this.nombre = "Cuenta borrada";
        this.passwordHash = null;
        this.googleSub = null;
        this.pesoCorporalKg = null;
        this.objetivo = null;
        this.diasPorSemana = null;
    }
    public String getIdioma() { return idioma; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
}
