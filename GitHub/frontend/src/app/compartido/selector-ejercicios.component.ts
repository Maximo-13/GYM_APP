import { Component, type OnInit, computed, inject, output, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { type EjercicioResumen, EjerciciosService } from '../core/ejercicios.service';

interface Grupo {
  patron: string;
  ejercicios: EjercicioResumen[];
}

/** Quita tildes y pasa a minúsculas para buscar "flexion" y encontrar "Flexión". */
const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * Lista del catálogo agrupada por patrón articular, con buscador y selección múltiple.
 * Se usa dentro de un <ion-modal> en el editor de rutinas y en la sesión.
 */
@Component({
  selector: 'app-selector-ejercicios',
  templateUrl: 'selector-ejercicios.component.html',
  // Dentro de un ion-modal, el contenido necesita la clase ion-page para ocupar toda la altura.
  host: { class: 'ion-page' },
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSearchbar,
    IonList,
    IonItemDivider,
    IonItem,
    IonCheckbox,
    IonLabel,
  ],
})
export class SelectorEjerciciosComponent implements OnInit {
  private readonly ejerciciosService = inject(EjerciciosService);

  /** Ejercicios elegidos, en el orden en que se marcaron. */
  readonly elegir = output<EjercicioResumen[]>();
  readonly cancelar = output<void>();

  private readonly todos = signal<EjercicioResumen[]>([]);
  readonly busqueda = signal('');
  readonly seleccion = signal<EjercicioResumen[]>([]);

  readonly grupos = computed<Grupo[]>(() => {
    const q = normalizar(this.busqueda().trim());
    const grupos = new Map<string, EjercicioResumen[]>();
    for (const e of this.todos()) {
      const texto = normalizar(`${e.nombre} ${e.musculo ?? ''} ${e.patron ?? ''} ${e.equipo ?? ''}`);
      if (q && !q.split(/\s+/).every((p) => texto.includes(p))) continue;
      const patron = e.patron ?? 'Sin clasificar';
      grupos.set(patron, [...(grupos.get(patron) ?? []), e]);
    }
    return [...grupos].map(([patron, ejercicios]) => ({ patron, ejercicios }));
  });

  async ngOnInit(): Promise<void> {
    this.todos.set(await this.ejerciciosService.listar());
  }

  estaElegido(e: EjercicioResumen): boolean {
    return this.seleccion().some((s) => s.id === e.id);
  }

  alternar(e: EjercicioResumen): void {
    this.seleccion.update((sel) => (sel.some((s) => s.id === e.id) ? sel.filter((s) => s.id !== e.id) : [...sel, e]));
  }
}
