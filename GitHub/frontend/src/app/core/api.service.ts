import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import { environment } from '../../environments/environment';

/** Error de la API con un mensaje listo para mostrar al usuario. */
export class ErrorApi extends Error {
  constructor(
    readonly status: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** Llamadas al servidor (Spring Boot). Los errores llegan como {"mensaje": "..."}. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly base = Capacitor.isNativePlatform() ? environment.apiUrlTelefono : environment.apiUrl;

  get<T>(ruta: string, token?: string): Promise<T> {
    return this.pedir<T>('GET', ruta, undefined, token);
  }

  post<T>(ruta: string, cuerpo: unknown, token?: string): Promise<T> {
    return this.pedir<T>('POST', ruta, cuerpo, token);
  }

  private async pedir<T>(metodo: string, ruta: string, cuerpo?: unknown, token?: string): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(`${this.base}${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      });
    } catch {
      throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revisa tu conexión a internet.');
    }

    const texto = await res.text();
    const datos = texto ? JSON.parse(texto) : null;
    if (!res.ok) {
      throw new ErrorApi(res.status, datos?.mensaje ?? `Error del servidor (${res.status})`);
    }
    return datos as T;
  }
}
