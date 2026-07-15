import { createClient } from '@/lib/supabase/client';
import { fechaHoyISO, fechaAyerISO, fechaAnteayerISO } from '@/lib/nutricion';
import type {
  EntregaDiaria,
  EntregaDiariaConCorral,
  AjusteConsumo,
  AjusteOrigen,
  AjusteDireccion,
  DetalleMH,
  LecturaTipo,
  ResumenDiaAnterior,
} from '@/types/database';

// ---------- Entregas diarias (historial inmutable — puntos 1 y 8) ----------

export interface ConfirmarEntregaInput {
  corral_id: string;
  cantidad_animales: number;
  peso_promedio_kg: number;
  dieta_id: string | null;
  dieta_nombre: string;
  consumo_objetivo_pct: number;
  consumo_ms_total_kg: number;
  detalle_mh: DetalleMH[];
  total_mh_kg: number;
  lectura_comedero: LecturaTipo | null;
  usuario?: string;
}

/** Registra la entrega confirmada de hoy para un corral. Es un upsert por (corral_id, fecha):
 * si el encargado confirma dos veces el mismo día, se actualiza la foto, no se duplica. */
export async function confirmarEntrega(input: ConfirmarEntregaInput): Promise<EntregaDiaria> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('entregas_diarias')
    .upsert(
      {
        ...input,
        usuario: input.usuario ?? 'Encargado',
        fecha: fechaHoyISO(),
        confirmado_en: new Date().toISOString(),
      },
      { onConflict: 'corral_id,fecha' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as EntregaDiaria;
}

export interface FiltroHistorial {
  fechaDesde?: string;
  fechaHasta?: string;
  corralId?: string;
  dietaId?: string;
  limite?: number;
}

export async function listarHistorial(filtro: FiltroHistorial = {}): Promise<EntregaDiariaConCorral[]> {
  const supabase = createClient();
  let query = supabase
    .from('entregas_diarias')
    .select('*, corral:corrales(id, nombre)')
    .order('fecha', { ascending: false });

  if (filtro.fechaDesde) query = query.gte('fecha', filtro.fechaDesde);
  if (filtro.fechaHasta) query = query.lte('fecha', filtro.fechaHasta);
  if (filtro.corralId) query = query.eq('corral_id', filtro.corralId);
  if (filtro.dietaId) query = query.eq('dieta_id', filtro.dietaId);
  if (filtro.limite) query = query.limit(filtro.limite);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as EntregaDiariaConCorral[];
}

/** Resumen liviano de ayer y anteayer para mostrar directo en la tarjeta del corral (punto 2). */
export async function obtenerResumenDiasAnteriores(corralId: string): Promise<ResumenDiaAnterior[]> {
  const supabase = createClient();
  const fechas = [fechaAyerISO(), fechaAnteayerISO()];

  const { data, error } = await supabase
    .from('entregas_diarias')
    .select('fecha, dieta_nombre, consumo_objetivo_pct, lectura_comedero')
    .eq('corral_id', corralId)
    .in('fecha', fechas)
    .order('fecha', { ascending: false });

  if (error) throw error;

  const porFecha = new Map(
    (data as Array<{ fecha: string; dieta_nombre: string; consumo_objetivo_pct: number; lectura_comedero: LecturaTipo | null }>).map((d) => [
      d.fecha,
      d,
    ])
  );

  return fechas.map((f) => {
    const registro = porFecha.get(f);
    return {
      fecha: f,
      dietaNombre: registro?.dieta_nombre ?? null,
      consumoObjetivoPct: registro?.consumo_objetivo_pct ?? null,
      lectura: registro?.lectura_comedero ?? null,
    };
  });
}

/** Lectura del comedero de ayer, usada para dar contexto cuando el usuario marca FALTA (punto 3). */
export async function obtenerLecturaAyerContexto(corralId: string): Promise<LecturaTipo | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('entregas_diarias')
    .select('lectura_comedero')
    .eq('corral_id', corralId)
    .eq('fecha', fechaAyerISO())
    .maybeSingle();

  if (error) throw error;
  return (data as { lectura_comedero: LecturaTipo | null } | null)?.lectura_comedero ?? null;
}

// ---------- Ajustes de consumo (puntos 3 y 4) ----------

export interface RegistrarAjusteInput {
  corral_id: string;
  origen: AjusteOrigen;
  porcentaje_ajuste: number;
  direccion: AjusteDireccion;
  consumo_anterior_pct: number;
  consumo_nuevo_pct: number;
  usuario?: string;
}

export async function registrarAjusteConsumo(input: RegistrarAjusteInput): Promise<AjusteConsumo> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ajustes_consumo')
    .insert({
      ...input,
      usuario: input.usuario ?? 'Encargado',
      fecha: fechaHoyISO(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as AjusteConsumo;
}

export async function listarAjustesCorral(corralId: string, limite = 20): Promise<AjusteConsumo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ajustes_consumo')
    .select('*')
    .eq('corral_id', corralId)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) throw error;
  return data as AjusteConsumo[];
}
