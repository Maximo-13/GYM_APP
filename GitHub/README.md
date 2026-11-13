# App de registro de entrenamiento

Monorepo con dos proyectos:

| Carpeta | Tecnología | Qué es |
| --- | --- | --- |
| `backend/` | Spring Boot 4.1 · Java 25+ · Maven (wrapper incluido) | API REST |
| `frontend/` | Angular 22 · Ionic 9 · Capacitor 8 | App móvil y web |

## Backend

```bash
cd backend
./mvnw spring-boot:run
```

Arranca en http://localhost:8080. Comprobación rápida: http://localhost:8080/actuator/health

No hace falta instalar Maven: `mvnw` (o `mvnw.cmd` en Windows) lo descarga solo.

## Frontend

```bash
cd frontend
npm start
```

Abre http://localhost:4200. Para Android/iOS, más adelante: `npx cap add android`.

## Pendiente

- Elegir base de datos del servidor (MySQL o PostgreSQL) y añadir JPA + Flyway.
- SQLite local en la app (`@capacitor-community/sqlite`).
