import { Component, type OnInit, inject, signal } from '@angular/core';
import {
  IonAccordion,
  IonAccordionGroup,
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { DatabaseService } from '../core/db/database.service';

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

/** Catálogo agrupado por patrón articular, leído de la base SQLite del teléfono. */
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
    IonLabel,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonNote,
  ],
})
export class PatronesPage implements OnInit {
  private readonly db = inject(DatabaseService);

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
}
