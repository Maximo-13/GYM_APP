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
Necesita MySQL encendido (XAMPP) con la base `gym_app`; Flyway crea las tablas.

### Cuentas (RF-01)

| Método | Ruta | Qué hace |
| --- | --- | --- |
| POST | `/api/auth/registro` | Crear cuenta con nombre, correo, contraseña y nivel |
| POST | `/api/auth/login` | Iniciar sesión con correo y contraseña |
| POST | `/api/auth/google` | Entrar o crear cuenta con Google (ID token) |
| GET | `/api/cuenta` | Datos de la cuenta (requiere `Authorization: Bearer <token>`) |
| PUT | `/api/cuenta/perfil` | Cambiar nombre, nivel, peso, objetivo y días por semana |
| DELETE | `/api/cuenta` | Borrar la cuenta (se anonimiza y se libera el correo) |
| POST | `/api/cuenta/google` | Vincular Google a la cuenta con sesión iniciada |

Las contraseñas se guardan cifradas con BCrypt y la sesión es un JWT de 30 días.
Variables de entorno para producción: `JWT_SECRET` (mínimo 32 caracteres),
`GOOGLE_CLIENT_IDS` y `CORS_ORIGENES`.

### Activar el inicio de sesión con Google

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto y configura
   la pantalla de consentimiento de OAuth.
2. En **Credenciales**, crea dos ID de cliente de OAuth:
   - **Aplicación web** (para el navegador y como "server client" de Android).
   - **Android**, con el paquete `com.gymapp.registro` y la huella SHA-1 del certificado
     (para pruebas: `keytool -list -v -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore -storepass android`).
3. Pon el ID de tipo web en `frontend/src/environments/environment*.ts` (`googleWebClientId`).
4. Arranca el backend con `GOOGLE_CLIENT_IDS=<id-web>,<id-android>`.

## Frontend

```bash
cd frontend
npm start
```

Abre http://localhost:4200.

### Android

El proyecto nativo está en `frontend/android` (id de la app: `com.gymapp.registro`).
Requiere Android Studio, que trae el SDK de Android, un JDK 21 y el emulador.

Cada vez que cambies la app, compila y copia los archivos al proyecto Android:

```bash
npm run android
```

Después, en Android Studio pulsa ▶ (Run) con tu teléfono conectado por USB
(con la depuración USB activada) o con un emulador.

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
- Crear cuenta e iniciar sesión con correo, guardadas en MySQL; sesión que se mantiene al cerrar la app (RF-01).
- Nivel elegido al crear la cuenta y editable en Mi cuenta (RF-02).
- Mi cuenta: peso corporal, objetivo y días por semana (RF-03); los cambios hechos sin internet se envían al volver la conexión.
- Borrar la cuenta y sus datos, en el servidor y en el teléfono (RNF-07).
- Lo registrado en el teléfono antes de tener cuenta pasa a la cuenta al entrar.
- Inicio de sesión y vinculación con Google listos en código; falta crear los ID de cliente en Google Cloud.
- Rutinas con ejercicios en orden, día y series objetivo (RF-08).
- Registro de series con peso, reps, RIR y check, editando la sesión en vivo (RF-09, RF-11, RF-13).
- Comparativa con la última vez: serie anterior, meta, Superado / Mantenido / Por debajo por 1RM estimado y barra de volumen (RF-14 a RF-17).
- Acción articular la primera vez que se registra cada ejercicio, según el nivel (RF-06).

## Pendiente

- Temporizador de descanso (RF-12), historial y gráficas (RF-18), columnas personalizadas (RF-10).
- Importar y exportar Excel (RF-27, RF-28).
- Sincronización de rutinas y sesiones con el servidor.
- Apple (iPhone), más adelante.
- Textos en archivos de idioma (RNF-13).
