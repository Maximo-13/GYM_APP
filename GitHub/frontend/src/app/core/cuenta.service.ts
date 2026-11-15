import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { type GoogleLoginResponseOnline, SocialLogin } from '@capgo/capacitor-social-login';

import { environment } from '../../environments/environment';

import { ApiService, ErrorApi } from './api.service';
import { type DatosPerfil, type Nivel, PerfilService } from './perfil.service';

export interface UsuarioServidor {
  id: string;
  nombre: string;
  email: string;
  nivel: Nivel;
  pesoCorporalKg: number | null;
  objetivo: string | null;
  diasPorSemana: number | null;
  tienePassword: boolean;
  vinculadoGoogle: boolean;
}

interface RespuestaAuth {
  token: string;
  usuario: UsuarioServidor;
  nueva: boolean;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
  nivel: Nivel;
}

const CLAVE_TOKEN = 'sesion.token';
const CLAVE_USUARIO = 'sesion.usuario';
/** Cambios del perfil hechos sin internet, pendientes de enviar al servidor. */
const CLAVE_PERFIL_PENDIENTE = 'sesion.perfilPendiente';

/**
 * Sesión de la cuenta (RF-01). El token se guarda en el almacenamiento de la app,
 * así la sesión sigue abierta al cerrar y volver a abrir, incluso sin internet.
 */
@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly api = inject(ApiService);
  private readonly perfil = inject(PerfilService);

  readonly usuario = signal<UsuarioServidor | null>(null);
  private token: string | null = null;
  private cargada?: Promise<void>;
  private googleIniciado?: Promise<void>;

  readonly googleDisponible = !!environment.googleWebClientId;

  /** Lee la sesión guardada una sola vez. */
  cargar(): Promise<void> {
    this.cargada ??= (async () => {
      this.token = (await Preferences.get({ key: CLAVE_TOKEN })).value;
      const guardado = (await Preferences.get({ key: CLAVE_USUARIO })).value;
      this.usuario.set(this.token && guardado ? (JSON.parse(guardado) as UsuarioServidor) : null);
      // Si quedaron cambios sin enviar, se intenta en segundo plano.
      void this.enviarPerfilPendiente().catch(() => undefined);
    })();
    return this.cargada;
  }

  async haySesion(): Promise<boolean> {
    await this.cargar();
    return !!this.token;
  }

  async registrar(datos: DatosRegistro): Promise<void> {
    const id = await this.perfil.idLocalPrevio();
    const res = await this.api.post<RespuestaAuth>('/api/auth/registro', { ...datos, id });
    await this.guardarSesion(res);
  }

  async entrar(email: string, password: string): Promise<void> {
    const res = await this.api.post<RespuestaAuth>('/api/auth/login', { email, password });
    await this.guardarSesion(res);
  }

  /**
   * Entrar con Google: Google confirma la identidad y nuestro servidor crea
   * o vincula la cuenta. `nivel` solo se usa si la cuenta es nueva.
   */
  async entrarConGoogle(nivel: Nivel | null): Promise<boolean> {
    const idToken = await this.tokenDeGoogle();
    const id = await this.perfil.idLocalPrevio();
    const res = await this.api.post<RespuestaAuth>('/api/auth/google', { idToken, id, nivel });
    await this.guardarSesion(res);
    return res.nueva;
  }

  /** Vincula Google a la cuenta con la sesión iniciada. */
  async vincularGoogle(): Promise<void> {
    const idToken = await this.tokenDeGoogle();
    const usuario = await this.api.post<UsuarioServidor>('/api/cuenta/google', { idToken }, this.token ?? undefined);
    this.usuario.set(usuario);
    await Preferences.set({ key: CLAVE_USUARIO, value: JSON.stringify(usuario) });
  }

  /**
   * Guarda el perfil primero en el teléfono (funciona sin internet) y luego lo
   * envía al servidor. Si no hay conexión, queda pendiente y se envía más tarde.
   * Devuelve true si ya quedó guardado también en el servidor.
   */
  async guardarPerfil(datos: DatosPerfil): Promise<boolean> {
    const actual = this.usuario();
    if (!actual) throw new ErrorApi(401, 'No hay sesión iniciada');
    const usuario: UsuarioServidor = { ...actual, ...datos };
    this.usuario.set(usuario);
    await Preferences.set({ key: CLAVE_USUARIO, value: JSON.stringify(usuario) });
    await this.perfil.establecer({ id: usuario.id, email: usuario.email, ...datos });
    await Preferences.set({ key: CLAVE_PERFIL_PENDIENTE, value: JSON.stringify(datos) });
    return this.enviarPerfilPendiente();
  }

  /** Envía al servidor el perfil pendiente, si lo hay. Sin conexión no falla: lo deja para luego. */
  async enviarPerfilPendiente(): Promise<boolean> {
    const pendiente = (await Preferences.get({ key: CLAVE_PERFIL_PENDIENTE })).value;
    if (!pendiente || !this.token) return !pendiente;
    try {
      const usuario = await this.api.put<UsuarioServidor>('/api/cuenta/perfil', JSON.parse(pendiente), this.token);
      await Preferences.remove({ key: CLAVE_PERFIL_PENDIENTE });
      this.usuario.set(usuario);
      await Preferences.set({ key: CLAVE_USUARIO, value: JSON.stringify(usuario) });
      return true;
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 0) return false; // sin conexión: se reintenta luego
      await Preferences.remove({ key: CLAVE_PERFIL_PENDIENTE });
      throw e;
    }
  }

  /** Borra la cuenta en el servidor y todos sus datos del teléfono (RNF-07). Requiere internet. */
  async borrarCuenta(): Promise<void> {
    const id = this.usuario()?.id;
    if (!this.token || !id) return;
    await this.api.delete('/api/cuenta', this.token);
    await this.perfil.borrarDatosLocales(id);
    await this.cerrarSesion();
  }

  async cerrarSesion(): Promise<void> {
    if (this.googleDisponible && this.usuario()?.vinculadoGoogle) {
      await SocialLogin.logout({ provider: 'google' }).catch(() => undefined);
    }
    await Preferences.remove({ key: CLAVE_TOKEN });
    await Preferences.remove({ key: CLAVE_USUARIO });
    await Preferences.remove({ key: CLAVE_PERFIL_PENDIENTE });
    this.token = null;
    this.usuario.set(null);
    await this.perfil.olvidarActual();
  }

  private async guardarSesion(res: RespuestaAuth): Promise<void> {
    const idAnterior = await this.perfil.idLocalPrevio();
    this.token = res.token;
    this.usuario.set(res.usuario);
    await Preferences.set({ key: CLAVE_TOKEN, value: res.token });
    await Preferences.set({ key: CLAVE_USUARIO, value: JSON.stringify(res.usuario) });
    const { id, nombre, email, nivel, pesoCorporalKg, objetivo, diasPorSemana } = res.usuario;
    await this.perfil.establecer({ id, nombre, email, nivel, pesoCorporalKg, objetivo, diasPorSemana });
    // Lo registrado en el teléfono antes de tener cuenta pasa a esta cuenta.
    if (idAnterior) await this.perfil.adoptarDatosSinCuenta(idAnterior, id);
  }

  private async tokenDeGoogle(): Promise<string> {
    if (!this.googleDisponible) {
      throw new ErrorApi(503, 'El inicio de sesión con Google todavía no está configurado');
    }
    this.googleIniciado ??= SocialLogin.initialize({ google: { webClientId: environment.googleWebClientId } });
    await this.googleIniciado;
    const { result } = await SocialLogin.login({ provider: 'google', options: { scopes: ['email', 'profile'] } });
    const idToken = (result as GoogleLoginResponseOnline).idToken;
    if (!idToken) throw new ErrorApi(401, 'Google no devolvió tu identidad. Inténtalo de nuevo.');
    return idToken;
  }
}
