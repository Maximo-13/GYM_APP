export const environment = {
  production: false,
  /** API cuando la app corre en el navegador (npm start). */
  apiUrl: 'http://localhost:8080',
  /**
   * API cuando la app corre en el teléfono: la IP de la PC en el WiFi (comando ipconfig).
   * El teléfono debe estar en el mismo WiFi. Cambiará cuando el servidor esté en internet.
   */
  apiUrlTelefono: 'http://192.168.18.8:8080',
  /** Client ID de Google de tipo "Aplicación web" (Google Cloud Console). Vacío = sin Google. */
  googleWebClientId: '',
};
