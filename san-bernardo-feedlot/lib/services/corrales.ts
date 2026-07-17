import { createClient } from '@/lib/supabase/client';
import type { Corral, CorralConDieta, LecturaComedero, LecturaTipo, HistorialDiario, DetalleMH } from '@/types/database';

export async function listarCorrales(): Promise<CorralConDieta[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('corrales')
    .select('*, dieta:dietas(*)')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data as unknown as CorralConDieta[];
}

export interface CorralInput {
  nombre: string;
  cantidad_animales: number;
  fecha_ingreso: string;
  peso_promedio_kg: number;
  origen?: string | null;
  dieta_id?: string | null;
  consumo_objetivo_pct?: number;
}

export async function crearCorral(input: CorralInput): Promise<Corral> {
  const supabase = createClient();
  const { data, error } = await supabase.from('corrales').insert(input).select().single();
  if (error) throw error;
  return data as Corral;
}

export async function actualizarCorral(id: string, input: Partial<CorralInput>): Promise<Corral> {
  const supabase = createClient();
  const { data, error } = await supabase.from('corrales').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Corral;
}

export async function asignarDieta(corralId: string, dietaId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('corrales').update({ dieta_id: dietaId }).eq('id', corralId);
  if (error) throw error;
}

export async function actualizarConsumoObjetivo(corralId: string, nuevoPct: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('corrales')
    .update({ consumo_objetivo_pct: nuevoPct })
    .eq('id', corralId);
  if (error) throw error;
}

export async function eliminarCorral(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('corrales').update({ activo: false }).eq('id', id);
  if (error) throw error;
}

// ---------- Lecturas de comedero ----------

const HOY = () => new Date().toISOString().slice(0, 10);
const AYER = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

export async function obtenerLecturaHoy(corralId: string): Promise<LecturaComedero | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lecturas_comedero')
    .select('*')
    .eq('corral_id', corralId)
    .eq('fecha', HOY())
    .maybeSingle();

  if (error) throw error;
  return data as LecturaComedero | null;
}

export async function obtenerLecturaAyer(corralId: string): Promise<LecturaComedero | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lecturas_comedero')
    .select('*')
    .eq('corral_id', corralId)
    .eq('fecha', AYER())
    .maybeSingle();

  if (error) throw error;
  return data as LecturaComedero | null;
}

/**
 * Registra la lectura de hoy (FALTA/JUSTO/SOBRA) para un corral.
 * No aplica ajustes de consumo por sí sola: eso lo decide el flujo en la UI
 * (confirmación del usuario) llamando a actualizarConsumoObjetivo aparte.
 */
export async function registrarLectura(
  corralId: string,
  lectura: LecturaTipo,
  consumoAnterior: number,
  consumoNuevo: number | null = null
): Promise<LecturaComedero> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lecturas_comedero')
    .upsert(
      {
        corral_id: corralId,
        fecha: HOY(),
        lectura,
        consumo_objetivo_pct_anterior: consumoAnterior,
        consumo_objetivo_pct_nuevo: consumoNuevo,
        ajuste_aplicado: consumoNuevo !== null,
      },
      { onConflict: 'corral_id,fecha' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as LecturaComedero;
}

// ---------- Historial diario (snapshot de lo calculado) ----------

export async function guardarHistorialDiario(params: {
  corral_id: string;
  dieta_id: string | null;
  cantidad_animales: number;
  peso_promedio_kg: number;
  consumo_objetivo_pct: number;
  consumo_ms_total_kg: number;
  detalle_mh: DetalleMH[];
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('historial_diario').upsert(
    {
      ...params,
      fecha: HOY(),
    },
    { onConflict: 'corral_id,fecha' }
  );
  if (error) throw error;
}

export async function listarHistorialCorral(corralId: string, limite = 14): Promise<HistorialDiario[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('historial_diario')
    .select('*')
    .eq('corral_id', corralId)
    .order('fecha', { ascending: false })
    .limit(limite);

  if (error) throw error;
  return data as unknown as HistorialDiario[];
}
