import { Component, type OnInit, inject, input, signal } from '@angular/core';
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
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonReorder,
  IonReorderGroup,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  type ReorderEndCustomEvent,
} from '@ionic/angular';

import { SelectorEjerciciosComponent } from '../compartido/selector-ejercicios.component';
import type { EjercicioResumen } from '../core/ejercicios.service';
import { DIAS_SEMANA, type Rutina, type RutinaEjercicio, RutinasService } from '../core/rutinas.service';

/** Crear o editar una rutina: nombre, día y ejercicios en orden con sus series objetivo (RF-08). */
@Component({
  selector: 'app-rutina',
  templateUrl: 'rutina.page.html',
  styleUrls: ['rutina.page.scss'],
  imports: [
    FormsModule,
    SelectorEjerciciosComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonReorderGroup,
    IonReorder,
    IonModal,
  ],
})
export class RutinaPage implements OnInit {
  private readonly rutinas = inject(RutinasService);
  private readonly router = inject(Router);
  private readonly alertas = inject(AlertController);

  /** Parámetro de la ruta: un id o "nueva". */
  readonly id = input.required<string>();

  readonly dias = DIAS_SEMANA;
  readonly nueva = signal(true);
  readonly nombre = signal('');
  readonly dia = signal<number | null>(null);
  readonly ejercicios = signal<RutinaEjercicio[]>([]);
  readonly selectorAbierto = signal(false);
  readonly guardando = signal(false);
  private rutinaId = '';

  async ngOnInit(): Promise<void> {
    if (this.id() === 'nueva') return;
    const r = await this.rutinas.obtener(this.id());
    if (!r) {
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
      return;
    }
    this.nueva.set(false);
    this.rutinaId = r.id;
    this.nombre.set(r.nombre);
    this.dia.set(r.dia_semana);
    this.ejercicios.set(r.ejercicios);
  }

  agregar(elegidos: EjercicioResumen[]): void {
    this.selectorAbierto.set(false);
    this.ejercicios.update((lista) => [
      ...lista,
      ...elegidos.map((e) => ({
        id: '',
        ejercicio_id: e.id,
        nombre: e.nombre,
        patron: e.patron,
        series_objetivo: 3,
        notas: null,
      })),
    ]);
  }

  cambiarSeries(indice: number, delta: number): void {
    this.ejercicios.update((lista) =>
      lista.map((e, i) =>
        i === indice ? { ...e, series_objetivo: Math.min(10, Math.max(1, (e.series_objetivo ?? 3) + delta)) } : e,
      ),
    );
  }

  quitar(indice: number): void {
    this.ejercicios.update((lista) => lista.filter((_, i) => i !== indice));
  }

  reordenar(ev: ReorderEndCustomEvent): void {
    this.ejercicios.set(ev.detail.complete(this.ejercicios()));
  }

  puedeGuardar(): boolean {
    return this.nombre().trim().length > 0 && this.ejercicios().length > 0 && !this.guardando();
  }

  async guardar(): Promise<void> {
    if (!this.puedeGuardar()) return;
    this.guardando.set(true);
    try {
      const rutina: Rutina = {
        id: this.rutinaId,
        nombre: this.nombre(),
        dia_semana: this.dia(),
        ejercicios: this.ejercicios(),
      };
      await this.rutinas.guardar(rutina);
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar(): Promise<void> {
    const alerta = await this.alertas.create({
      header: '¿Eliminar rutina?',
      message: `"${this.nombre()}" desaparecerá de tu lista. Las sesiones que ya registraste se conservan.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role !== 'destructive') return;
    await this.rutinas.eliminar(this.rutinaId);
    await this.router.navigateByUrl('/inicio', { replaceUrl: true });
  }
}
