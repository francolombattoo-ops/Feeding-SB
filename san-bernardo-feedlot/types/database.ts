// ============================================================
// Tipos del dominio San Bernardo Feedlot
// Reflejan 1:1 el esquema de supabase/schema.sql
// ============================================================

export interface Alimento {
  id: string;
  nombre: string;
  materia_seca_pct: number;       // %
  energia_metabolizable: number;  // Mcal/kg MS
  proteina_bruta_pct: number;     // % sobre MS
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type AlimentoInput = Omit<Alimento, 'id' | 'created_at' | 'updated_at' | 'activo'> & {
  activo?: boolean;
};

export interface Dieta {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DietaIngrediente {
  id: string;
  dieta_id: string;
  alimento_id: string;
  porcentaje_ms: number;
}

// Ingrediente "hidratado" con los datos del alimento, usado en UI y cálculos
export interface DietaIngredienteConAlimento extends DietaIngrediente {
  alimento: Alimento;
}

export interface DietaCompleta extends Dieta {
  ingredientes: DietaIngredienteConAlimento[];
}

export type LecturaTipo = 'FALTA' | 'JUSTO' | 'SOBRA';

export interface Corral {
  id: string;
  nombre: string;
  cantidad_animales: number;
  fecha_ingreso: string; // ISO date
  peso_promedio_kg: number;
  origen: string | null;
  dieta_id: string | null;
  consumo_objetivo_pct: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CorralConDieta extends Corral {
  dieta: Dieta | null;
}

export interface LecturaComedero {
  id: string;
  corral_id: string;
  fecha: string;
  lectura: LecturaTipo;
  consumo_objetivo_pct_anterior: number | null;
  consumo_objetivo_pct_nuevo: number | null;
  ajuste_aplicado: boolean;
  created_at: string;
}

export interface DetalleMH {
  alimento_id: string;
  nombre: string;
  kg_ms: number;
  kg_mh: number;
}

export interface HistorialDiario {
  id: string;
  corral_id: string;
  fecha: string;
  dieta_id: string | null;
  cantidad_animales: number;
  peso_promedio_kg: number;
  consumo_objetivo_pct: number;
  consumo_ms_total_kg: number;
  detalle_mh: DetalleMH[];
  created_at: string;
}
