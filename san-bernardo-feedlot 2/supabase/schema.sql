-- ============================================================
-- SAN BERNARDO FEEDLOT — ESQUEMA DE BASE DE DATOS (Supabase/Postgres)
-- ============================================================
-- Diseño: toda la lógica nutricional vive en Materia Seca (MS).
-- La Materia Húmeda (MH) se calcula al vuelo, nunca se persiste
-- como fuente de verdad (evita inconsistencias).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ALIMENTOS ----------
create table if not exists alimentos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  materia_seca_pct numeric(5,2) not null check (materia_seca_pct > 0 and materia_seca_pct <= 100),
  energia_metabolizable numeric(5,2) not null check (energia_metabolizable > 0), -- Mcal/kg MS
  proteina_bruta_pct numeric(5,2) not null check (proteina_bruta_pct >= 0 and proteina_bruta_pct <= 100), -- % sobre MS
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- DIETAS ----------
create table if not exists dietas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- INGREDIENTES DE DIETA (relación N:M con % de MS) ----------
create table if not exists dieta_ingredientes (
  id uuid primary key default gen_random_uuid(),
  dieta_id uuid not null references dietas(id) on delete cascade,
  alimento_id uuid not null references alimentos(id) on delete restrict,
  porcentaje_ms numeric(5,2) not null check (porcentaje_ms > 0 and porcentaje_ms <= 100),
  created_at timestamptz not null default now(),
  unique (dieta_id, alimento_id)
);

-- ---------- CORRALES ----------
create table if not exists corrales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,               -- ej "Corral 12"
  cantidad_animales integer not null check (cantidad_animales > 0),
  fecha_ingreso date not null,
  peso_promedio_kg numeric(6,2) not null check (peso_promedio_kg > 0),
  origen text,
  dieta_id uuid references dietas(id) on delete set null,
  consumo_objetivo_pct numeric(5,2) not null default 2.40 check (consumo_objetivo_pct > 0 and consumo_objetivo_pct <= 10),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- LECTURAS DE COMEDERO (historial diario) ----------
create type lectura_tipo as enum ('FALTA', 'JUSTO', 'SOBRA');

create table if not exists lecturas_comedero (
  id uuid primary key default gen_random_uuid(),
  corral_id uuid not null references corrales(id) on delete cascade,
  fecha date not null default current_date,
  lectura lectura_tipo not null,
  consumo_objetivo_pct_anterior numeric(5,2),
  consumo_objetivo_pct_nuevo numeric(5,2),
  ajuste_aplicado boolean not null default false,
  created_at timestamptz not null default now(),
  unique (corral_id, fecha) -- una lectura por corral por día
);

-- ---------- HISTORIAL DIARIO DE ENTREGA (snapshot de lo calculado/entregado) ----------
create table if not exists historial_diario (
  id uuid primary key default gen_random_uuid(),
  corral_id uuid not null references corrales(id) on delete cascade,
  fecha date not null default current_date,
  dieta_id uuid references dietas(id) on delete set null,
  cantidad_animales integer not null,
  peso_promedio_kg numeric(6,2) not null,
  consumo_objetivo_pct numeric(5,2) not null,
  consumo_ms_total_kg numeric(9,2) not null,
  detalle_mh jsonb not null, -- [{alimento_id, nombre, kg_ms, kg_mh}]
  created_at timestamptz not null default now(),
  unique (corral_id, fecha)
);

-- ---------- Trigger genérico updated_at ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_alimentos_updated_at before update on alimentos
  for each row execute function set_updated_at();
create trigger trg_dietas_updated_at before update on dietas
  for each row execute function set_updated_at();
create trigger trg_corrales_updated_at before update on corrales
  for each row execute function set_updated_at();

-- ---------- Índices ----------
create index if not exists idx_dieta_ingredientes_dieta on dieta_ingredientes(dieta_id);
create index if not exists idx_corrales_dieta on corrales(dieta_id);
create index if not exists idx_lecturas_corral_fecha on lecturas_comedero(corral_id, fecha desc);
create index if not exists idx_historial_corral_fecha on historial_diario(corral_id, fecha desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- Nota: se habilita RLS con política abierta para authenticated.
-- Ajustar según el modelo de usuarios (Administrador/Nutricionista/Encargado)
-- cuando se implemente esa funcionalidad futura.
-- ============================================================
alter table alimentos enable row level security;
alter table dietas enable row level security;
alter table dieta_ingredientes enable row level security;
alter table corrales enable row level security;
alter table lecturas_comedero enable row level security;
alter table historial_diario enable row level security;

create policy "authenticated_all_alimentos" on alimentos for all to authenticated using (true) with check (true);
create policy "authenticated_all_dietas" on dietas for all to authenticated using (true) with check (true);
create policy "authenticated_all_dieta_ingredientes" on dieta_ingredientes for all to authenticated using (true) with check (true);
create policy "authenticated_all_corrales" on corrales for all to authenticated using (true) with check (true);
create policy "authenticated_all_lecturas" on lecturas_comedero for all to authenticated using (true) with check (true);
create policy "authenticated_all_historial" on historial_diario for all to authenticated using (true) with check (true);

-- ============================================================
-- Datos de ejemplo (opcional, comentar si no se desea)
-- ============================================================
-- insert into alimentos (nombre, materia_seca_pct, energia_metabolizable, proteina_bruta_pct) values
--   ('Maíz', 88, 3.20, 9),
--   ('Silaje de maíz', 35, 2.45, 8),
--   ('Expeller de soja', 90, 3.05, 46),
--   ('Núcleo', 92, 2.10, 32);
