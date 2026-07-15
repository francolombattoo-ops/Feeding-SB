import { createClient } from '@/lib/supabase/client';
import type { Alimento, AlimentoInput } from '@/types/database';

export async function listarAlimentos(): Promise<Alimento[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('alimentos')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data as Alimento[];
}

export async function crearAlimento(input: AlimentoInput): Promise<Alimento> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('alimentos')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as Alimento;
}

export async function actualizarAlimento(id: string, input: Partial<AlimentoInput>): Promise<Alimento> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('alimentos')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Alimento;
}

/** Baja lógica (no se borra físicamente para preservar historial de dietas que ya lo usaron). */
export async function eliminarAlimento(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('alimentos')
    .update({ activo: false })
    .eq('id', id);

  if (error) throw error;
}
