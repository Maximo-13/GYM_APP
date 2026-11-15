package com.gymapp.backend.cuenta;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, String> {

    /** Los correos se guardan siempre en minúsculas. */
    Optional<Usuario> findByEmailAndDeletedAtIsNull(String email);

    Optional<Usuario> findByGoogleSubAndDeletedAtIsNull(String googleSub);

    boolean existsByEmail(String email);
}
