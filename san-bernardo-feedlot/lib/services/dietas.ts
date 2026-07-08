import { createClient } from '@/lib/supabase/client';
import type { Dieta, DietaCompleta, DietaIngredienteConAlimento } from '@/types/database';

export async function listarDietas(): Promise<Dieta[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dietas')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data as Dieta[];
}

export async function obtenerDietaCompleta(dietaId: string): Promise<DietaCompleta> {
  const supabase = createClient();

  const { data: dieta, error: errDieta } = await supabase
    .from('dietas')
    .select('*')
    .eq('id', dietaId)
    .single();
  if (errDieta) throw errDieta;

  const { data: ingredientes, error: errIng } = await supabase
    .from('dieta_ingredientes')
    .select('*, alimento:alimentos(*)')
    .eq('dieta_id', dietaId);
  if (errIng) throw errIng;

  return {
    ...(dieta as Dieta),
    ingredientes: ingredientes as unknown as DietaIngredienteConAlimento[],
  };
}

export async function listarDietasCompletas(): Promise<DietaCompleta[]> {
  const dietas = await listarDietas();
  const completas = await Promise.all(dietas.map((d) => obtenerDietaCompleta(d.id)));
  return completas;
}

export interface GuardarDietaInput {
  nombre: string;
  descripcion?: string | null;
  ingredientes: Array<{ alimento_id: string; porcentaje_ms: number }>;
}

/** Crea o actualiza una dieta junto con sus ingredientes (reemplaza el set completo). */
export async function guardarDieta(input: GuardarDietaInput, dietaId?: string): Promise<string> {
  const supabase = createClient();

  const suma = input.ingredientes.reduce((acc, i) => acc + i.porcentaje_ms, 0);
  if (Math.abs(suma - 100) > 0.01) {
    throw new Error('La suma de porcentajes de MS debe ser exactamente 100%.');
  }

  let id = dietaId;

  if (id) {
    const { error } = await supabase
      .from('dietas')
      .update({ nombre: input.nombre, descripcion: input.descripcion ?? null })
      .eq('id', id);
    if (error) throw error;

    // Reemplazar ingredientes existentes
    const { error: errDel } = await supabase.from('dieta_ingredientes').delete().eq('dieta_id', id);
    if (errDel) throw errDel;
  } else {
    const { data, error } = await supabase
      .from('dietas')
      .insert({ nombre: input.nombre, descripcion: input.descripcion ?? null })
      .select()
      .single();
    if (error) throw error;
    id = (data as Dieta).id;
  }

  const filas = input.ingredientes.map((i) => ({
    dieta_id: id,
    alimento_id: i.alimento_id,
    porcentaje_ms: i.porcentaje_ms,
  }));

  const { error: errIns } = await supabase.from('dieta_ingredientes').insert(filas);
  if (errIns) throw errIns;

  return id!;
}

export async function eliminarDieta(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('dietas').update({ activo: false }).eq('id', id);
  if (error) throw error;
}
