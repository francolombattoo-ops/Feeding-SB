-- ============================================================
-- SAN BERNARDO FEEDLOT — MIGRACIÓN V2
-- ------------------------------------------------------------
-- No modifica ni elimina nada de la V1. Solo agrega.
-- Ejecutar este script UNA vez, después de schema.sql, en el
-- SQL Editor de Supabase.
-- ============================================================

-- ---------- 1. Capacidad máxima del mixer por dieta (punto 7) ----------
alter table dietas
  add column if not exists capacidad_maxima_mh numeric(9,2);
-- null = sin límite definido, la app no advierte en ese caso.

-- ---------- 2. Entregas diarias — registro inmutable "foto del día" (puntos 1 y 8) ----------
-- Reemplaza en concepto a historial_diario (que era un snapshot automático
-- de cálculo). entregas_diarias es el registro real de una entrega
-- CONFIRMADA por el encargado desde "Preparación del mixer".
-- historial_diario se deja intacta por compatibilidad, pero la V2 de la
-- app pasa a leer/escribir de entregas_diarias, que tiene más contexto.
create table if not exists entregas_diarias (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  corral_id uuid not null references corrales(id) on delete cascade,
  cantidad_animales integer not null,
  peso_promedio_kg numeric(6,2) not null,
  dieta_id uuid references dietas(id) on delete set null,
  dieta_nombre text not null,          -- copia inmutable del nombre, por si la dieta se borra/renombra después
  consumo_objetivo_pct numeric(5,2) not null,
  consumo_ms_total_kg numeric(9,2) not null,
  detalle_mh jsonb not null,           -- [{alimento_id, nombre, kg_ms, kg_mh}]
  total_mh_kg numeric(9,2) not null,
  lectura_comedero lectura_tipo,       -- puede ser null si aún no se leyó ese día
  usuario text not null default 'Encargado', -- preparado para multi-usuario futuro
  confirmado_en timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (corral_id, fecha)
);

create index if not exists idx_entregas_corral_fecha on entregas_diarias(corral_id, fecha desc);
create index if not exists idx_entregas_fecha on entregas_diarias(fecha desc);
create index if not exists idx_entregas_dieta on entregas_diarias(dieta_id);

alter table entregas_diarias enable row level security;
create policy "anon_all_entregas_diarias" on entregas_diarias for all to anon using (true) with check (true);
create policy "authenticated_all_entregas_diarias" on entregas_diarias for all to authenticated using (true) with check (true);

-- ---------- 3. Ajustes de consumo — manuales o por lectura (puntos 3 y 4) ----------
create type ajuste_origen as enum ('LECTURA_SOBRA', 'LECTURA_FALTA', 'MANUAL');

create table if not exists ajustes_consumo (
  id uuid primary key default gen_random_uuid(),
  corral_id uuid not null references corrales(id) on delete cascade,
  fecha date not null default current_date,
  origen ajuste_origen not null,
  porcentaje_ajuste numeric(5,2) not null,     -- ej 5.00 = 5%
  direccion text not null check (direccion in ('AUMENTO', 'REDUCCION')),
  consumo_anterior_pct numeric(5,2) not null,
  consumo_nuevo_pct numeric(5,2) not null,
  usuario text not null default 'Encargado',
  created_at timestamptz not null default now()
);

create index if not exists idx_ajustes_corral_fecha on ajustes_consumo(corral_id, fecha desc);

alter table ajustes_consumo enable row level security;
create policy "anon_all_ajustes_consumo" on ajustes_consumo for all to anon using (true) with check (true);
create policy "authenticated_all_ajustes_consumo" on ajustes_consumo for all to authenticated using (true) with check (true);

-- ---------- 4. Días calendario sin registro (punto 9) ----------
-- No se requiere tabla nueva: la app genera los días "faltantes" entre la
-- fecha de ingreso del corral y hoy calculando la diferencia de fechas en
-- el cliente/servicio, y solo persiste en entregas_diarias los días donde
-- hubo una confirmación real. Esto evita millones de filas vacías.

-- ---------- 5. Usuario en lecturas_comedero (preparado para multi-usuario) ----------
alter table lecturas_comedero
  add column if not exists usuario text not null default 'Encargado';
