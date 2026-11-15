import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/angular';

import { CuentaService } from '../core/cuenta.service';
import type { Nivel } from '../core/perfil.service';

interface OpcionNivel {
  nivel: Nivel;
  titulo: string;
  descripcion: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Crear cuenta con nombre, correo, contraseña y nivel (RF-01, RF-02). También con Google. */
@Component({
  selector: 'app-crear-cuenta',
  templateUrl: 'crear-cuenta.page.html',
  styleUrls: ['cuenta.scss'],
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonSpinner],
})
export class CrearCuentaPage {
  private readonly cuenta = inject(CuentaService);
  private readonly router = inject(Router);

  readonly googleDisponible = this.cuenta.googleDisponible;
  nombre = '';
  email = '';
  password = '';
  readonly nivel = signal<Nivel | null>(null);
  readonly cargando = signal<'correo' | 'google' | null>(null);
  readonly error = signal<string | null>(null);

  readonly opciones: OpcionNivel[] = [
    {
      nivel: 'PRINCIPIANTE',
      titulo: 'Principiante',
      descripcion: 'Te explicamos cada movimiento con fotos y palabras simples.',
    },
    { nivel: 'INTERMEDIO', titulo: 'Intermedio', descripcion: 'Ves el término técnico con una foto de apoyo.' },
    { nivel: 'AVANZADO', titulo: 'Avanzado', descripcion: 'Solo registras. Sin explicaciones en medio.' },
  ];

  /** Valida en el teléfono lo mismo que el servidor, para avisar sin esperar a la red. */
  private validar(): string | null {
    if (!this.nombre.trim()) return 'Escribe tu nombre';
    if (!EMAIL.test(this.email.trim())) return 'El correo no es válido';
    if (this.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!this.nivel()) return 'Elige tu nivel';
    return null;
  }

  async crear(): Promise<void> {
    if (this.cargando()) return;
    const problema = this.validar();
    if (problema) {
      this.error.set(problema);
      return;
    }
    await this.intentar('correo', () =>
      this.cuenta.registrar({
        nombre: this.nombre.trim(),
        email: this.email.trim(),
        password: this.password,
        nivel: this.nivel()!,
      }),
    );
  }

  async google(): Promise<void> {
    if (this.cargando()) return;
    if (!this.nivel()) {
      this.error.set('Elige tu nivel antes de continuar con Google');
      return;
    }
    await this.intentar('google', () => this.cuenta.entrarConGoogle(this.nivel()));
  }

  private async intentar(tipo: 'correo' | 'google', accion: () => Promise<unknown>): Promise<void> {
    this.cargando.set(tipo);
    this.error.set(null);
    try {
      await accion();
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
    } finally {
      this.cargando.set(null);
    }
  }
}
