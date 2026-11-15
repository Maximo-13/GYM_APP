package com.gymapp.backend.comun;

import org.springframework.http.HttpStatus;

/** Error de negocio con su código HTTP y un mensaje listo para mostrar al usuario. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String mensaje) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
