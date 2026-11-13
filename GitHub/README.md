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

La app guarda todo en una base SQLite dentro del teléfono (en el navegador usa sql.js
guardado en IndexedDB). El esquema está en `src/app/core/db/esquema.ts` y el catálogo de
patrones y ejercicios en `src/assets/catalogo.json`.

Si cambias el catálogo en el backend (nueva migración de Flyway), arranca el backend una vez
para aplicarla y regenera el catálogo de la app con MySQL encendido:

```bash
npm run catalogo
```

## Hecho

- Base de datos del servidor: MySQL con JPA + Flyway (migraciones V1 a V4).
- Base SQLite en la app, con el mismo catálogo e IDs que el servidor.
- Pantalla de bienvenida para elegir el nivel (RF-02).

## Pendiente

- Rutinas (RF-08) y registro de sesiones y series (RF-09, RF-11, RF-13).
- Comparativa en vivo con la semana pasada (RF-14 a RF-16).
- Cuenta y login (RF-01) y sincronización con el servidor.
- Textos en archivos de idioma (RNF-13).
