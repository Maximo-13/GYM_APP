import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/angular';

import { CuentaService } from '../core/cuenta.service';

/** Iniciar sesión con correo y contraseña, o con Google (RF-01). */
@Component({
  selector: 'app-entrar',
  templateUrl: 'entrar.page.html',
  styleUrls: ['cuenta.scss'],
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonSpinner],
})
export class EntrarPage {
  private readonly cuenta = inject(CuentaService);
  private readonly router = inject(Router);

  readonly googleDisponible = this.cuenta.googleDisponible;
  email = '';
  password = '';
  readonly cargando = signal<'correo' | 'google' | null>(null);
  readonly error = signal<string | null>(null);

  async entrar(): Promise<void> {
    if (this.cargando()) return;
    if (!this.email.trim() || !this.password) {
      this.error.set('Escribe tu correo y tu contraseña');
      return;
    }
    await this.intentar('correo', () => this.cuenta.entrar(this.email, this.password));
  }

  async google(): Promise<void> {
    if (this.cargando()) return;
    // Si la cuenta de Google es nueva, se crea con nivel principiante (se cambia en ajustes).
    await this.intentar('google', () => this.cuenta.entrarConGoogle(null));
  }

  private async intentar(tipo: 'correo' | 'google', accion: () => Promise<unknown>): Promise<void> {
    this.cargando.set(tipo);
    this.error.set(null);
    try {
      await accion();
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    } finally {
      this.cargando.set(null);
    }
  }
}
