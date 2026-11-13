import { compararSerie, metaSerie, textoSerie, unoRmEstimado } from './comparativa';

describe('comparativa', () => {
  describe('unoRmEstimado (Epley)', () => {
    it('calcula peso × (1 + reps / 30)', () => {
      expect(unoRmEstimado({ peso_kg: 60, repeticiones: 10 })).toBeCloseTo(80);
    });
    it('con 1 repetición devuelve el propio peso', () => {
      expect(unoRmEstimado({ peso_kg: 100, repeticiones: 1 })).toBe(100);
    });
    it('sin peso devuelve null', () => {
      expect(unoRmEstimado({ peso_kg: null, repeticiones: 10 })).toBeNull();
    });
  });

  describe('compararSerie', () => {
    const anterior = { peso_kg: 60, repeticiones: 8 };

    it('más repeticiones con el mismo peso = Superado', () => {
      expect(compararSerie({ peso_kg: 60, repeticiones: 9 }, anterior)).toBe('SUPERADO');
    });
    it('mismo peso y repeticiones = Mantenido', () => {
      expect(compararSerie({ peso_kg: 60, repeticiones: 8 }, anterior)).toBe('MANTENIDO');
    });
    it('más peso y una repetición menos con 1RM equivalente = Mantenido', () => {
      // 60 × 8 → 76,0 kg; 61,5 × 7 → 75,85 kg (−0,2 %) → Mantenido; 62,5 × 7 → 77,08 kg (+1,4 %) → Superado
      expect(compararSerie({ peso_kg: 61.5, repeticiones: 7 }, anterior)).toBe('MANTENIDO');
      expect(compararSerie({ peso_kg: 62.5, repeticiones: 7 }, anterior)).toBe('SUPERADO');
    });
    it('menos repeticiones con el mismo peso = Por debajo', () => {
      expect(compararSerie({ peso_kg: 60, repeticiones: 6 }, anterior)).toBe('POR_DEBAJO');
    });
    it('sin peso compara repeticiones (dominadas)', () => {
      const prev = { peso_kg: null, repeticiones: 10 };
      expect(compararSerie({ peso_kg: null, repeticiones: 11 }, prev)).toBe('SUPERADO');
      expect(compararSerie({ peso_kg: null, repeticiones: 10 }, prev)).toBe('MANTENIDO');
      expect(compararSerie({ peso_kg: null, repeticiones: 8 }, prev)).toBe('POR_DEBAJO');
    });
    it('sin serie anterior o sin repeticiones no compara', () => {
      expect(compararSerie({ peso_kg: 60, repeticiones: 8 }, null)).toBeNull();
      expect(compararSerie({ peso_kg: 60, repeticiones: null }, anterior)).toBeNull();
    });
  });

  it('la meta es el mismo peso con una repetición más', () => {
    expect(metaSerie({ peso_kg: 60, repeticiones: 8 })).toEqual({ peso_kg: 60, repeticiones: 9 });
    expect(metaSerie(null)).toBeNull();
  });

  it('formatea series', () => {
    expect(textoSerie({ peso_kg: 62.5, repeticiones: 8 })).toBe('62.5 kg × 8');
    expect(textoSerie({ peso_kg: null, repeticiones: 12 })).toBe('× 12');
  });
});
