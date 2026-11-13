import { Component, type OnInit, inject, signal } from '@angular/core';
import {
  IonAccordion,
  IonAccordionGroup,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonToolbar,
} from '@ionic/angular';

import { DatabaseService } from '../core/db/database.service';
import { type Nivel, PerfilService } from '../core/perfil.service';

interface EjercicioFila {
  patron_id: string;
  patron: string;
  descripcion_simple: string | null;
  ejercicio: string | null;
  musculo: string | null;
}

interface PatronConEjercicios {
  id: string;
  nombre: string;
  descripcion: string | null;
  ejercicios: { nombre: string; musculo: string | null }[];
}

/**
 * Pantalla de patrones: muestra el catálogo agrupado por patrón articular,
 * leído de la base SQLite del teléfono, y permite cambiar el nivel.
 */
@Component({
  selector: 'app-patrones',
  templateUrl: 'patrones.page.html',
  styleUrls: ['patrones.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonNote,
  ],
})
export class PatronesPage implements OnInit {
  private readonly db = inject(DatabaseService);
  readonly perfil = inject(PerfilService).perfil;
  private readonly perfilService = inject(PerfilService);

  readonly patrones = signal<PatronConEjercicios[]>([]);
  readonly totalEjercicios = signal(0);

  async ngOnInit(): Promise<void> {
    const filas = await this.db.consultar<EjercicioFila>(
      `SELECT p.id AS patron_id, p.nombre AS patron, p.descripcion_simple,
              e.nombre AS ejercicio, m.nombre AS musculo
         FROM patron_articular p
         LEFT JOIN ejercicio e ON e.patron_articular_id = p.id AND e.deleted_at IS NULL
         LEFT JOIN musculo m   ON m.id = e.musculo_id
        ORDER BY p.orden, e.nombre`,
    );
    const porPatron = new Map<string, PatronConEjercicios>();
    for (const f of filas) {
      let p = porPatron.get(f.patron_id);
      if (!p) {
        p = { id: f.patron_id, nombre: f.patron, descripcion: f.descripcion_simple, ejercicios: [] };
        porPatron.set(f.patron_id, p);
      }
      if (f.ejercicio) p.ejercicios.push({ nombre: f.ejercicio, musculo: f.musculo });
    }
    this.patrones.set([...porPatron.values()]);
    this.totalEjercicios.set(filas.filter((f) => f.ejercicio).length);
  }

  cambiarNivel(valor: unknown): void {
    if (valor) void this.perfilService.cambiarNivel(valor as Nivel);
  }
}
