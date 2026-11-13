import { DecimalPipe } from '@angular/common';
import { Component, type OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonProgressBar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { SelectorEjerciciosComponent } from '../compartido/selector-ejercicios.component';
import { type DatosSerie, type EstadoSerie, compararSerie, metaSerie, textoSerie } from '../core/comparativa';
import type { EjercicioResumen } from '../core/ejercicios.service';
import { PerfilService } from '../core/perfil.service';
import { type Serie, type Sesion, type SesionEjercicio, SesionesService } from '../core/sesiones.service';

const ETIQUETAS: Record<EstadoSerie, string> = {
  SUPERADO: 'Superado',
  MANTENIDO: 'Mantenido',
  POR_DEBAJO: 'Por debajo',
};

/**
 * Registro de una sesión (RF-09, RF-11, RF-13) con la comparativa en vivo
 * frente a la última vez (RF-14 a RF-17) y la acción articular la primera vez (RF-06).
 * Cada cambio se guarda al instante en la base del teléfono.
 */
@Component({
  selector: 'app-sesion',
  templateUrl: 'sesion.page.html',
  styleUrls: ['sesion.page.scss'],
  imports: [
    DecimalPipe,
    SelectorEjerciciosComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonProgressBar,
    IonModal,
  ],
})
export class SesionPage implements OnInit {
  private readonly sesiones = inject(SesionesService);
  private readonly router = inject(Router);
  private readonly alertas = inject(AlertController);
  readonly perfil = inject(PerfilService).perfil;

  readonly id = input.required<string>();
  readonly sesion = signal<Sesion | null>(null);
  readonly selectorAbierto = signal(false);

  readonly texto = textoSerie;
  readonly etiquetas = ETIQUETAS;

  /** Tonelaje (kg × reps) de las series completadas en esta sesión. */
  readonly tonelaje = computed(() =>
    (this.sesion()?.ejercicios ?? [])
      .flatMap((e) => e.series)
      .filter((s) => s.completada)
      .reduce((total, s) => total + (s.peso_kg ?? 0) * (s.repeticiones ?? 0), 0),
  );

  readonly resumen = computed(() => {
    const series = (this.sesion()?.ejercicios ?? []).flatMap((e) => e.series.map((s) => this.estado(e, s)));
    return {
      superadas: series.filter((s) => s === 'SUPERADO').length,
      mantenidas: series.filter((s) => s === 'MANTENIDO').length,
      porDebajo: series.filter((s) => s === 'POR_DEBAJO').length,
    };
  });

  async ngOnInit(): Promise<void> {
    await this.recargar();
    if (!this.sesion()) await this.router.navigateByUrl('/inicio', { replaceUrl: true });
  }

  private async recargar(): Promise<void> {
    this.sesion.set(await this.sesiones.obtener(this.id()));
  }

  /** Fuerza a Angular a repintar tras modificar una serie en su sitio. */
  private refrescar(): void {
    const s = this.sesion();
    if (s) this.sesion.set({ ...s, ejercicios: [...s.ejercicios] });
  }

  // ------------------------------------------------------------ comparativa
  anterior(e: SesionEjercicio, s: Serie): DatosSerie | undefined {
    return e.anteriores[s.numero];
  }

  meta(e: SesionEjercicio, s: Serie): DatosSerie | null {
    return metaSerie(this.anterior(e, s));
  }

  estado(e: SesionEjercicio, s: Serie): EstadoSerie | null {
    return s.completada ? compararSerie(s, this.anterior(e, s)) : null;
  }

  haceCuanto(fecha: string | null): string {
    if (!fecha) return '';
    const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000);
    return dias <= 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`;
  }

  // ------------------------------------------------------------- series
  async cambiarCampo(s: Serie, campo: 'peso_kg' | 'repeticiones' | 'rir', valor: string): Promise<void> {
    const limpio = valor.replace(',', '.').trim();
    let numero: number | null = limpio === '' ? null : Number(limpio);
    if (numero !== null && (!Number.isFinite(numero) || numero < 0)) numero = null;
    if (numero !== null && campo !== 'peso_kg') numero = Math.round(numero);
    if (campo === 'rir' && numero !== null) numero = Math.min(10, numero);
    s[campo] = numero;
    this.refrescar();
    await this.sesiones.guardarSerie(s);
  }

  /**
   * Marca o desmarca la serie. Si se marca sin datos, copia los de la última vez:
   * repetir lo de la semana pasada cuesta un solo toque (RNF-02).
   */
  async alternarCompletada(e: SesionEjercicio, s: Serie): Promise<void> {
    if (!s.completada && s.repeticiones == null) {
      const previo = this.anterior(e, s) ?? this.ultimaCompletada(e);
      if (!previo?.repeticiones) return;
      s.peso_kg ??= previo.peso_kg;
      s.repeticiones = previo.repeticiones;
    }
    s.completada = !s.completada;
    this.refrescar();
    await this.sesiones.guardarSerie(s);
  }

  private ultimaCompletada(e: SesionEjercicio): Serie | undefined {
    return [...e.series].reverse().find((x) => x.completada);
  }

  async agregarSerie(e: SesionEjercicio): Promise<void> {
    const ultima = e.series.at(-1);
    const nueva = await this.sesiones.agregarSerie(e.id, (ultima?.numero ?? 0) + 1);
    e.series.push(nueva);
    this.refrescar();
  }

  async quitarUltimaSerie(e: SesionEjercicio): Promise<void> {
    const ultima = e.series.at(-1);
    if (!ultima) return;
    const restantes = e.series.slice(0, -1);
    await this.sesiones.eliminarSerie(e.id, ultima.id, restantes);
    e.series = restantes;
    this.refrescar();
  }

  // ---------------------------------------------------------- ejercicios
  async agregarEjercicios(elegidos: EjercicioResumen[]): Promise<void> {
    this.selectorAbierto.set(false);
    const s = this.sesion();
    if (!s) return;
    let orden = s.ejercicios.length;
    for (const e of elegidos) await this.sesiones.agregarEjercicio(s.id, e.id, orden++);
    await this.recargar();
  }

  async mover(indice: number, delta: number): Promise<void> {
    const s = this.sesion();
    const destino = indice + delta;
    if (!s || destino < 0 || destino >= s.ejercicios.length) return;
    const lista = [...s.ejercicios];
    [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
    this.sesion.set({ ...s, ejercicios: lista });
    await this.sesiones.reordenar(lista.map((e) => e.id));
  }

  async quitarEjercicio(e: SesionEjercicio): Promise<void> {
    if (
      e.series.some((s) => s.completada) &&
      !(await this.confirmar(`¿Quitar ${e.nombre}?`, 'Se borrarán sus series registradas.', 'Quitar'))
    ) {
      return;
    }
    await this.sesiones.quitarEjercicio(e.id);
    const s = this.sesion();
    if (s) this.sesion.set({ ...s, ejercicios: s.ejercicios.filter((x) => x.id !== e.id) });
  }

  // ----------------------------------------------------- intro (RF-06)
  mostrarIntro(e: SesionEjercicio): boolean {
    return !e.intro_vista && !!e.patron && this.perfil()?.nivel !== 'AVANZADO';
  }

  async entendido(e: SesionEjercicio): Promise<void> {
    await this.sesiones.marcarIntroVista(e.ejercicio_id);
    const s = this.sesion();
    if (!s) return;
    // El mismo ejercicio puede aparecer dos veces en la sesión.
    for (const x of s.ejercicios) if (x.ejercicio_id === e.ejercicio_id) x.intro_vista = true;
    this.refrescar();
  }

  // -------------------------------------------------------- terminar
  async terminar(): Promise<void> {
    const s = this.sesion();
    if (!s) return;
    const completadas = s.ejercicios.flatMap((e) => e.series).filter((x) => x.completada).length;
    if (completadas === 0) {
      if (await this.confirmar('No registraste ninguna serie', '¿Quieres descartar esta sesión?', 'Descartar')) {
        await this.sesiones.descartar(s.id);
        await this.router.navigateByUrl('/inicio', { replaceUrl: true });
      }
      return;
    }
    const r = this.resumen();
    const ok = await this.confirmar(
      '¿Terminar entrenamiento?',
      `${completadas} series · ${Math.round(this.tonelaje())} kg de volumen. ` +
        `Superadas ${r.superadas}, mantenidas ${r.mantenidas}, por debajo ${r.porDebajo}.`,
      'Terminar',
    );
    if (!ok) return;
    await this.sesiones.finalizar(s.id);
    await this.router.navigateByUrl('/inicio', { replaceUrl: true });
  }

  async descartar(): Promise<void> {
    const s = this.sesion();
    if (
      !s ||
      !(await this.confirmar('¿Descartar sesión?', 'Se borrará todo lo registrado en esta sesión.', 'Descartar'))
    ) {
      return;
    }
    await this.sesiones.descartar(s.id);
    await this.router.navigateByUrl('/inicio', { replaceUrl: true });
  }

  private async confirmar(header: string, message: string, accion: string): Promise<boolean> {
    const alerta = await this.alertas.create({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: accion, role: 'confirm' },
      ],
    });
    await alerta.present();
    return (await alerta.onDidDismiss()).role === 'confirm';
  }
}
