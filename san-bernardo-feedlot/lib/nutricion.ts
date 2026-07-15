// ============================================================
// MOTOR DE CÁLCULO NUTRICIONAL — San Bernardo Feedlot
// ------------------------------------------------------------
// REGLA DE ORO: toda la lógica interna trabaja en Materia Seca (MS).
// La Materia Húmeda (MH) es exclusivamente una vista de salida
// para el operario que carga el mixer. Nunca se ajusta ni se
// persiste como fuente de verdad.
// ============================================================

import type { Alimento, DietaIngredienteConAlimento, DetalleMH } from '@/types/database';

/** Fecha calendario de hoy en formato ISO (YYYY-MM-DD), en la zona horaria local del navegador/servidor.
 * Nunca usar "últimas 24 horas": el día cambia a las 00:00, no de forma rodante. */
export function fechaHoyISO(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

/** Fecha calendario de "ayer" en formato ISO. */
export function fechaAyerISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

/** Fecha calendario de "anteayer" en formato ISO. */
export function fechaAnteayerISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

/** Devuelve todas las fechas calendario (ISO) entre una fecha de inicio y hoy, inclusive. */
export function rangoDiasDesde(fechaInicioISO: string): string[] {
  const inicio = new Date(fechaInicioISO + 'T00:00:00');
  const hoy = new Date(fechaHoyISO() + 'T00:00:00');
  const dias: string[] = [];
  const cursor = new Date(inicio);
  while (cursor <= hoy) {
    dias.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

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

// ---------- Ajuste de consumo por lectura de comedero (con % configurable) ----------

export const AJUSTE_SOBRA_PCT = 5; // sugerido por defecto, editable por el usuario (punto 3/4 v2)
export const AJUSTE_FALTA_PCT = 5; // sugerido por defecto, editable por el usuario

/** Nuevo consumo objetivo tras SOBRA. porcentaje en unidades (ej 5 = 5%), no fracción. */
export function aplicarAjusteSobra(consumoActualPct: number, porcentaje: number = AJUSTE_SOBRA_PCT): number {
  return round2(consumoActualPct * (1 - porcentaje / 100));
}

/** Nuevo consumo objetivo tras FALTA (con contexto del día anterior). */
export function aplicarAjusteFalta(consumoActualPct: number, porcentaje: number = AJUSTE_FALTA_PCT): number {
  return round2(consumoActualPct * (1 + porcentaje / 100));
}

/** Ajuste manual genérico (botones ➖ / ➕ del punto 4 v2). */
export function aplicarAjusteManual(
  consumoActualPct: number,
  porcentaje: number,
  direccion: 'AUMENTO' | 'REDUCCION'
): number {
  return direccion === 'AUMENTO'
    ? round2(consumoActualPct * (1 + porcentaje / 100))
    : round2(consumoActualPct * (1 - porcentaje / 100));
}

// ---------- Preparación del mixer: múltiples corrales a la vez (puntos 5, 6, 7) ----------

export interface CorralParaMixer {
  corralId: string;
  corralNombre: string;
  dietaId: string | null;
  dietaNombre: string | null;
  pesoPromedioKg: number;
  cantidadAnimales: number;
  consumoObjetivoPct: number;
}

export interface ResultadoMixer {
  valido: boolean;
  motivoInvalido: string | null;
  dietaId: string | null;
  dietaNombre: string | null;
  detalleAgregado: DetalleMH[]; // sumado entre todos los corrales seleccionados
  totalMhKg: number;
  capacidadMaximaMh: number | null;
  excedeCapacidad: boolean;
}

/**
 * Suma la carga de MH de varios corrales seleccionados para preparar el mixer.
 * Antes de sumar, valida que todos compartan la misma dieta (punto 6): si no,
 * devuelve valido=false con un mensaje claro y no calcula nada.
 */
export function calcularMixer(
  corrales: CorralParaMixer[],
  dietasCompletas: Array<{ id: string; ingredientes: DietaIngredienteConAlimento[]; capacidad_maxima_mh: number | null }>
): ResultadoMixer {
  if (corrales.length === 0) {
    return {
      valido: false,
      motivoInvalido: 'Seleccioná al menos un corral para preparar el mixer.',
      dietaId: null,
      dietaNombre: null,
      detalleAgregado: [],
      totalMhKg: 0,
      capacidadMaximaMh: null,
      excedeCapacidad: false,
    };
  }

  const sinDieta = corrales.find((c) => !c.dietaId);
  if (sinDieta) {
    return {
      valido: false,
      motivoInvalido: `El corral "${sinDieta.corralNombre}" no tiene dieta asignada.`,
      dietaId: null,
      dietaNombre: null,
      detalleAgregado: [],
      totalMhKg: 0,
      capacidadMaximaMh: null,
      excedeCapacidad: false,
    };
  }

  const dietasDistintas = new Set(corrales.map((c) => c.dietaId));
  if (dietasDistintas.size > 1) {
    return {
      valido: false,
      motivoInvalido: 'No es posible preparar una misma carga para corrales con dietas diferentes.',
      dietaId: null,
      dietaNombre: null,
      detalleAgregado: [],
      totalMhKg: 0,
      capacidadMaximaMh: null,
      excedeCapacidad: false,
    };
  }

  const dietaId = corrales[0].dietaId!;
  const dietaNombre = corrales[0].dietaNombre;
  const dieta = dietasCompletas.find((d) => d.id === dietaId);

  if (!dieta) {
    return {
      valido: false,
      motivoInvalido: 'No se encontró la información completa de la dieta seleccionada.',
      dietaId,
      dietaNombre,
      detalleAgregado: [],
      totalMhKg: 0,
      capacidadMaximaMh: null,
      excedeCapacidad: false,
    };
  }

  // Acumular por alimento_id a través de todos los corrales
  const acumulado = new Map<string, DetalleMH>();

  for (const corral of corrales) {
    const consumoMsTotal = calcularConsumoMSTotal(corral.pesoPromedioKg, corral.consumoObjetivoPct, corral.cantidadAnimales);
    const detalle = calcularDetalleMH(consumoMsTotal, dieta.ingredientes);

    for (const item of detalle) {
      const existente = acumulado.get(item.alimento_id);
      if (existente) {
        existente.kg_ms = round2(existente.kg_ms + item.kg_ms);
        existente.kg_mh = round2(existente.kg_mh + item.kg_mh);
      } else {
        acumulado.set(item.alimento_id, { ...item });
      }
    }
  }

  const detalleAgregado = Array.from(acumulado.values());
  const total = totalMH(detalleAgregado);
  const capacidadMaximaMh = dieta.capacidad_maxima_mh;
  const excedeCapacidad = capacidadMaximaMh != null && total > capacidadMaximaMh;

  return {
    valido: true,
    motivoInvalido: null,
    dietaId,
    dietaNombre,
    detalleAgregado,
    totalMhKg: total,
    capacidadMaximaMh,
    excedeCapacidad,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
