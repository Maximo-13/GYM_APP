import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';

import { type Nivel, PerfilService } from '../core/perfil.service';

interface OpcionNivel {
  nivel: Nivel;
  titulo: string;
  descripcion: string;
  ejemplo: string;
}

/** RF-02: el usuario elige su nivel una sola vez al empezar (se podrá cambiar en ajustes). */
@Component({
  selector: 'app-bienvenida',
  templateUrl: 'bienvenida.page.html',
  styleUrls: ['bienvenida.page.scss'],
  imports: [IonContent, IonButton, IonSpinner],
})
export class BienvenidaPage {
  private readonly perfil = inject(PerfilService);
  private readonly router = inject(Router);

  readonly elegido = signal<Nivel | null>(null);
  readonly guardando = signal(false);

  readonly opciones: OpcionNivel[] = [
    {
      nivel: 'PRINCIPIANTE',
      titulo: 'Principiante',
      descripcion: 'Te explicamos cada movimiento con fotos y palabras simples.',
      ejemplo: '"Tu brazo baja por el costado" · aducción de hombro',
    },
    {
      nivel: 'INTERMEDIO',
      titulo: 'Intermedio',
      descripcion: 'Ves el término técnico con una foto de apoyo.',
      ejemplo: 'Aducción de hombro + foto',
    },
    {
      nivel: 'AVANZADO',
      titulo: 'Avanzado',
      descripcion: 'Solo registras. Sin explicaciones en medio.',
      ejemplo: 'Directo a tus series',
    },
  ];

  async empezar(): Promise<void> {
    const nivel = this.elegido();
    if (!nivel || this.guardando()) return;
    this.guardando.set(true);
    try {
      await this.perfil.crear(nivel);
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
    } finally {
      this.guardando.set(false);
    }
  }
}
