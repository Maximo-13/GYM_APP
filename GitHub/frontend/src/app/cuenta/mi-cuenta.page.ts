import { Component, type OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CuentaService } from '../core/cuenta.service';
import type { Nivel } from '../core/perfil.service';

export const OBJETIVOS = [
  'Ganar músculo',
  'Ganar fuerza',
  'Perder grasa',
  'Salud y bienestar',
  'Rendimiento deportivo',
];

/** Mi cuenta: nombre, nivel y datos opcionales (RF-02, RF-03), Google, cerrar sesión y borrar cuenta. */
@Component({
  selector: 'app-mi-cuenta',
  templateUrl: 'mi-cuenta.page.html',
  styleUrls: ['mi-cuenta.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
  ],
})
export class MiCuentaPage implements OnInit {
  private readonly cuenta = inject(CuentaService);
  private readonly router = inject(Router);
  private readonly alertas = inject(AlertController);

  readonly usuario = this.cuenta.usuario;
  readonly googleDisponible = this.cuenta.googleDisponible;
  readonly objetivos = OBJETIVOS;
  readonly dias = [1, 2, 3, 4, 5, 6, 7];
  readonly niveles: { valor: Nivel; texto: string }[] = [
    { valor: 'PRINCIPIANTE', texto: 'Principiante' },
    { valor: 'INTERMEDIO', texto: 'Intermedio' },
    { valor: 'AVANZADO', texto: 'Avanzado' },
  ];

  nombre = '';
  nivel: Nivel = 'PRINCIPIANTE';
  peso: string | number | null = null;
  objetivo: string | null = null;
  diasPorSemana: number | null = null;

  readonly guardando = signal(false);
  readonly mensaje = signal<{ tipo: 'ok' | 'aviso' | 'error'; texto: string } | null>(null);

  ngOnInit(): void {
    const u = this.usuario();
    if (!u) return;
    this.nombre = u.nombre;
    this.nivel = u.nivel;
    this.peso = u.pesoCorporalKg;
    this.objetivo = u.objetivo;
    this.diasPorSemana = u.diasPorSemana;
  }

  private validar(): { error: string } | { peso: number | null } {
    if (!this.nombre.trim()) return { error: 'Escribe tu nombre' };
    const texto = String(this.peso ?? '')
      .replace(',', '.')
      .trim();
    if (!texto) return { peso: null };
    const peso = Number(texto);
    if (!Number.isFinite(peso) || peso < 20 || peso > 400) return { error: 'El peso debe estar entre 20 y 400 kg' };
    return { peso: Math.round(peso * 100) / 100 };
  }

  async guardar(): Promise<void> {
    if (this.guardando()) return;
    const v = this.validar();
    if ('error' in v) {
      this.mensaje.set({ tipo: 'error', texto: v.error });
      return;
    }
    this.guardando.set(true);
    try {
      const enServidor = await this.cuenta.guardarPerfil({
        nombre: this.nombre.trim(),
        nivel: this.nivel,
        pesoCorporalKg: v.peso,
        objetivo: this.objetivo,
        diasPorSemana: this.diasPorSemana,
      });
      this.mensaje.set(
        enServidor
          ? { tipo: 'ok', texto: 'Cambios guardados.' }
          : { tipo: 'aviso', texto: 'Guardado en el teléfono. Se enviará a tu cuenta cuando haya conexión.' },
      );
    } catch (e) {
      this.mensaje.set({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo guardar' });
    } finally {
      this.guardando.set(false);
    }
  }

  async vincularGoogle(): Promise<void> {
    try {
      await this.cuenta.vincularGoogle();
      this.mensaje.set({ tipo: 'ok', texto: 'Tu cuenta quedó vinculada con Google.' });
    } catch (e) {
      this.mensaje.set({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo vincular Google' });
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.cuenta.cerrarSesion();
    await this.router.navigateByUrl('/entrar', { replaceUrl: true });
  }

  async borrarCuenta(): Promise<void> {
    const alerta = await this.alertas.create({
      header: '¿Borrar tu cuenta?',
      message:
        'Se borrarán tu cuenta y todos tus entrenamientos, en el servidor y en este teléfono. No se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar cuenta', role: 'destructive' },
      ],
    });
    await alerta.present();
    if ((await alerta.onDidDismiss()).role !== 'destructive') return;
    try {
      await this.cuenta.borrarCuenta();
      await this.router.navigateByUrl('/crear-cuenta', { replaceUrl: true });
    } catch (e) {
      this.mensaje.set({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo borrar la cuenta' });
    }
  }
}
