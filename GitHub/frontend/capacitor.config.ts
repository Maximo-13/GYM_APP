import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymapp.registro',
  appName: 'Gym App',
  webDir: 'www',
  plugins: {
    // Las peticiones a la API salen por la capa nativa: sin problemas de CORS
    // ni de "contenido mixto" al llamar a http://IP-de-la-PC desde la app.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
