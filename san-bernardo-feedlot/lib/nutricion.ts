// ============================================================
// MOTOR DE CÁLCULO NUTRICIONAL — San Bernardo Feedlot
// ------------------------------------------------------------
// REGLA DE ORO: toda la lógica interna trabaja en Materia Seca (MS).
// La Materia Húmeda (MH) es exclusivamente una vista de salida
// para el operario que carga el mixer. Nunca se ajusta ni se
// persiste como fuente de verdad.
// ============================================================

import type { Alimento, DietaIngredienteConAlimento, DetalleMH } from '@/types/database';

/** Indicadores nutricionales agregados de una dieta, calculados a partir de sus ingredientes (% MS). */
export interface IndicadoresDieta {
  materiaSecaPromedioPct: number; // MS ponderada de la dieta (%)
  energiaMetabolizable: number;   // Mcal/kg MS
  proteinaBrutaPct: number;       // % sobre MS
  relacionPbEm: number;           // PB(%) / EM
  sumaPorcentajes: number;        // debe ser 100
  esValida: boolean;              // true si sumaPorcentajes === 100 (con tolerancia)
}

const TOLERANCIA_SUMA = 0.01; // tolerancia por redondeo flotante

/**
 * Calcula los indicadores nutricionales agregados de una dieta.
 * Cada ingrediente aporta proporcionalmente a su % de MS en la dieta.
 */
export function calcularIndicadoresDieta(
  ingredientes: Array<{ porcentaje_ms: number; alimento: Alimento }>
): IndicadoresDieta {
  const sumaPorcentajes = round2(
    ingredientes.reduce((acc, i) => acc + i.porcentaje_ms, 0)
  );

  if (ingredientes.length === 0) {
    return {
      materiaSecaPromedioPct: 0,
      energiaMetabolizable: 0,
      proteinaBrutaPct: 0,
      relacionPbEm: 0,
      sumaPorcentajes: 0,
      esValida: false,
    };
  }

  // Cada campo del alimento se pondera por su participación (%MS) en la dieta.
  let msPonderada = 0;
  let emPonderada = 0;
  let pbPonderada = 0;

  for (const ing of ingredientes) {
    const peso = ing.porcentaje_ms / 100;
    msPonderada += ing.alimento.materia_seca_pct * peso;
    emPonderada += ing.alimento.energia_metabolizable * peso;
    pbPonderada += ing.alimento.proteina_bruta_pct * peso;
  }

  const relacionPbEm = emPonderada > 0 ? pbPonderada / emPonderada : 0;

  return {
    materiaSecaPromedioPct: round2(msPonderada),
    energiaMetabolizable: round2(emPonderada),
    proteinaBrutaPct: round2(pbPonderada),
    relacionPbEm: round2(relacionPbEm),
    sumaPorcentajes,
    esValida: Math.abs(sumaPorcentajes - 100) <= TOLERANCIA_SUMA,
  };
}

/** Consumo diario de Materia Seca para un corral: peso vivo × %consumo objetivo. */
export function calcularConsumoMSporAnimal(pesoPromedioKg: number, consumoObjetivoPct: number): number {
  return round2(pesoPromedioKg * (consumoObjetivoPct / 100));
}

/** Consumo total de MS del corral (todos los animales). */
export function calcularConsumoMSTotal(
  pesoPromedioKg: number,
  consumoObjetivoPct: number,
  cantidadAnimales: number
): number {
  const porAnimal = calcularConsumoMSporAnimal(pesoPromedioKg, consumoObjetivoPct);
  return round2(porAnimal * cantidadAnimales);
}

/**
 * Reparte el consumo total de MS del corral entre los ingredientes de la dieta
 * (según su % de MS) y convierte cada uno a Materia Húmeda para el operario.
 *
 * Conversión: Kg MH = Kg MS ÷ (%MS_del_alimento / 100)
 */
export function calcularDetalleMH(
  consumoMSTotalKg: number,
  ingredientes: DietaIngredienteConAlimento[]
): DetalleMH[] {
  return ingredientes.map((ing) => {
    const kgMs = round2(consumoMSTotalKg * (ing.porcentaje_ms / 100));
    const kgMh = round2(kgMs / (ing.alimento.materia_seca_pct / 100));
    return {
      alimento_id: ing.alimento_id,
      nombre: ing.alimento.nombre,
      kg_ms: kgMs,
      kg_mh: kgMh,
    };
  });
}

export function totalMH(detalle: DetalleMH[]): number {
  return round2(detalle.reduce((acc, d) => acc + d.kg_mh, 0));
}

// ---------- Ajuste automático de consumo por lectura de comedero ----------

export const AJUSTE_SOBRA_PCT = 0.05; // reduce 5%
export const AJUSTE_FALTA_PCT = 0.05; // aumenta 5% (solo tras 2 FALTA consecutivas)

/** Nuevo consumo objetivo tras marcar SOBRA (reduce 5%). */
export function aplicarAjusteSobra(consumoActualPct: number): number {
  return round2(consumoActualPct * (1 - AJUSTE_SOBRA_PCT));
}

/** Nuevo consumo objetivo tras dos FALTA consecutivas (aumenta 5%). */
export function aplicarAjusteFalta(consumoActualPct: number): number {
  return round2(consumoActualPct * (1 + AJUSTE_FALTA_PCT));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
