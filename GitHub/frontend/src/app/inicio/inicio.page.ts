import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  type ViewWillEnter,
} from '@ionic/angular';

import { DIAS_SEMANA, type RutinaResumen, RutinasService } from '../core/rutinas.service';
import { SesionesService } from '../core/sesiones.service';

/** Inicio: rutinas del usuario, la de hoy primero, y la sesión en curso si la hay. */
@Component({
  selector: 'app-inicio',
  templateUrl: 'inicio.page.html',
  styleUrls: ['inicio.page.scss'],
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class InicioPage implements ViewWillEnter {
  private readonly rutinasService = inject(RutinasService);
  private readonly sesiones = inject(SesionesService);
  private readonly router = inject(Router);

  readonly rutinas = signal<RutinaResumen[]>([]);
  readonly enCurso = signal<{ id: string; rutina: string | null; inicio: string } | null>(null);
  readonly cargado = signal(false);
  readonly iniciando = signal(false);

  /** 1 = lunes … 7 = domingo, como en la base de datos. */
  readonly hoy = ((new Date().getDay() + 6) % 7) + 1;
  readonly dias = DIAS_SEMANA;

  async ionViewWillEnter(): Promise<void> {
    const [rutinas, enCurso] = await Promise.all([this.rutinasService.listar(), this.sesiones.enCurso()]);
    this.rutinas.set(rutinas);
    this.enCurso.set(enCurso);
    this.cargado.set(true);
  }

  rutinaDeHoy(): RutinaResumen | undefined {
    return this.rutinas().find((r) => r.dia_semana === this.hoy);
  }

  async empezar(rutinaId: string | null): Promise<void> {
    if (this.iniciando()) return;
    this.iniciando.set(true);
    try {
      const id = await this.sesiones.iniciar(rutinaId);
      await this.router.navigate(['/sesion', id]);
    } finally {
      this.iniciando.set(false);
    }
  }

  haceCuanto(fecha: string | null): string {
    if (!fecha) return 'Sin registros todavía';
    const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000);
    if (dias <= 0) return 'Última vez: hoy';
    if (dias === 1) return 'Última vez: ayer';
    return `Última vez: hace ${dias} días`;
  }
}
