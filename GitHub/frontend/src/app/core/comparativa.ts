/**
 * Lógica de la comparativa en vivo (RF-14 a RF-16).
 * Funciones puras, sin base de datos, para poder probarlas aisladas.
 */

export type EstadoSerie = 'SUPERADO' | 'MANTENIDO' | 'POR_DEBAJO';

export interface DatosSerie {
  peso_kg: number | null;
  repeticiones: number | null;
}

/** Margen dentro del cual dos series se consideran iguales (±1 % del 1RM estimado). */
export const MARGEN_MANTENIDO = 0.01;

/**
 * 1RM estimado con la fórmula de Epley: peso × (1 + reps / 30).
 * Con 1 repetición el 1RM es el propio peso. Sin peso (peso corporal) devuelve null.
 */
export function unoRmEstimado(s: DatosSerie): number | null {
  if (!s.peso_kg || !s.repeticiones || s.peso_kg <= 0 || s.repeticiones <= 0) return null;
  if (s.repeticiones === 1) return s.peso_kg;
  return s.peso_kg * (1 + s.repeticiones / 30);
}

/**
 * Compara una serie con la misma serie de la sesión anterior.
 * Con peso usa el 1RM estimado; sin peso (dominadas, fondos...) compara repeticiones.
 * Devuelve null si falta algún dato para comparar.
 */
export function compararSerie(actual: DatosSerie, anterior: DatosSerie | null | undefined): EstadoSerie | null {
  if (!anterior || !actual.repeticiones || !anterior.repeticiones) return null;

  const rmActual = unoRmEstimado(actual);
  const rmAnterior = unoRmEstimado(anterior);
  if (rmActual !== null && rmAnterior !== null) {
    const cambio = (rmActual - rmAnterior) / rmAnterior;
    if (cambio > MARGEN_MANTENIDO) return 'SUPERADO';
    if (cambio < -MARGEN_MANTENIDO) return 'POR_DEBAJO';
    return 'MANTENIDO';
  }

  // Sin peso en alguna de las dos: solo se comparan repeticiones si ninguna lleva peso.
  if (!actual.peso_kg && !anterior.peso_kg) {
    if (actual.repeticiones > anterior.repeticiones) return 'SUPERADO';
    if (actual.repeticiones < anterior.repeticiones) return 'POR_DEBAJO';
    return 'MANTENIDO';
  }
  return null;
}

/** Meta para superar la serie anterior: mismo peso y una repetición más (RF-15). */
export function metaSerie(anterior: DatosSerie | null | undefined): DatosSerie | null {
  if (!anterior?.repeticiones) return null;
  return { peso_kg: anterior.peso_kg, repeticiones: anterior.repeticiones + 1 };
}

/** Texto corto de una serie: "60 kg × 8" o "× 12" si no lleva peso. */
export function textoSerie(s: DatosSerie | null | undefined): string {
  if (!s?.repeticiones) return '';
  const peso = s.peso_kg ? `${Number(s.peso_kg.toFixed(2))} kg ` : '';
  return `${peso}× ${s.repeticiones}`;
}
