-- ============================================================
-- SAN BERNARDO FEEDLOT — MIGRACIÓN V3: LOGIN Y ROLES
-- ------------------------------------------------------------
-- Ejecutar en el SQL Editor de Supabase, después de schema.sql
-- y migration_v2.sql. No borra datos existentes.
-- ============================================================

-- ---------- 1. Tabla de perfiles (rol de cada usuario autenticado) ----------
create type rol_usuario as enum ('ADMINISTRADOR', 'ENCARGADO');

create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol rol_usuario not null default 'ENCARGADO',
  created_at timestamptz not null default now()
);

alter table perfiles enable row level security;

-- Cualquier usuario autenticado puede ver todos los perfiles (para mostrar
-- nombres en el historial, por ejemplo), pero solo puede editar el propio.
create policy "perfiles_select_authenticated" on perfiles for select to authenticated using (true);
create policy "perfiles_update_self" on perfiles for update to authenticated using (auth.uid() = id);

-- Al crearse un usuario nuevo en Supabase Auth, se crea automáticamente su
-- perfil con rol ENCARGADO por defecto. Un Administrador puede subirle el
-- rol después desde el SQL Editor (ver instrucciones al final).
create or replace function crear_perfil_automatico()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre, rol)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), 'ENCARGADO');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function crear_perfil_automatico();

-- ---------- 2. Reemplazar políticas "anon" por políticas basadas en rol ----------
-- Primero quitamos las políticas abiertas (anon) que usamos temporalmente.

drop policy if exists "anon_all_alimentos" on alimentos;
drop policy if exists "anon_all_dietas" on dietas;
drop policy if exists "anon_all_dieta_ingredientes" on dieta_ingredientes;
drop policy if exists "anon_all_corrales" on corrales;
drop policy if exists "anon_all_lecturas" on lecturas_comedero;
drop policy if exists "anon_all_historial" on historial_diario;
drop policy if exists "anon_all_entregas_diarias" on entregas_diarias;
drop policy if exists "anon_all_ajustes_consumo" on ajustes_consumo;

-- También quitamos las políticas "authenticated_all" genéricas del schema
-- original, para reemplazarlas por reglas más finas según el rol.
drop policy if exists "authenticated_all_alimentos" on alimentos;
drop policy if exists "authenticated_all_dietas" on dietas;
drop policy if exists "authenticated_all_dieta_ingredientes" on dieta_ingredientes;
drop policy if exists "authenticated_all_corrales" on corrales;
drop policy if exists "authenticated_all_lecturas" on lecturas_comedero;
drop policy if exists "authenticated_all_historial" on historial_diario;
drop policy if exists "authenticated_all_entregas_diarias" on entregas_diarias;
drop policy if exists "authenticated_all_ajustes_consumo" on ajustes_consumo;

-- Función helper: ¿el usuario actual es Administrador?
create or replace function es_administrador()
returns boolean as $$
  select exists (
    select 1 from perfiles where id = auth.uid() and rol = 'ADMINISTRADOR'
  );
$$ language sql security definer stable;

-- ---------- ALIMENTOS: solo Administrador puede escribir; ambos roles leen ----------
create policy "alimentos_select_authenticated" on alimentos for select to authenticated using (true);
create policy "alimentos_write_admin" on alimentos for insert to authenticated with check (es_administrador());
create policy "alimentos_update_admin" on alimentos for update to authenticated using (es_administrador());
create policy "alimentos_delete_admin" on alimentos for delete to authenticated using (es_administrador());

-- ---------- DIETAS: solo Administrador escribe; ambos leen ----------
create policy "dietas_select_authenticated" on dietas for select to authenticated using (true);
create policy "dietas_write_admin" on dietas for insert to authenticated with check (es_administrador());
create policy "dietas_update_admin" on dietas for update to authenticated using (es_administrador());
create policy "dietas_delete_admin" on dietas for delete to authenticated using (es_administrador());

create policy "dieta_ingredientes_select_authenticated" on dieta_ingredientes for select to authenticated using (true);
create policy "dieta_ingredientes_write_admin" on dieta_ingredientes for insert to authenticated with check (es_administrador());
create policy "dieta_ingredientes_update_admin" on dieta_ingredientes for update to authenticated using (es_administrador());
create policy "dieta_ingredientes_delete_admin" on dieta_ingredientes for delete to authenticated using (es_administrador());

-- ---------- CORRALES: Administrador crea/edita/borra; Encargado solo lee y asigna dieta/consumo ----------
create policy "corrales_select_authenticated" on corrales for select to authenticated using (true);
create policy "corrales_insert_admin" on corrales for insert to authenticated with check (es_administrador());
create policy "corrales_delete_admin" on corrales for delete to authenticated using (es_administrador());
-- Update lo pueden hacer ambos roles (el Encargado necesita asignar dieta y ajustar consumo)
create policy "corrales_update_authenticated" on corrales for update to authenticated using (true);

-- ---------- LECTURAS, ENTREGAS, AJUSTES: ambos roles leen y escriben (es el trabajo diario del Encargado) ----------
create policy "lecturas_all_authenticated" on lecturas_comedero for all to authenticated using (true) with check (true);
create policy "historial_all_authenticated" on historial_diario for all to authenticated using (true) with check (true);
create policy "entregas_all_authenticated" on entregas_diarias for all to authenticated using (true) with check (true);
create policy "ajustes_all_authenticated" on ajustes_consumo for all to authenticated using (true) with check (true);

-- ============================================================
-- CÓMO CREAR TU PRIMER USUARIO ADMINISTRADOR
-- ============================================================
-- 1. En Supabase, andá a Authentication > Users > Add user > Create new user.
--    Poné tu email y una contraseña. Confirmá el email manualmente si te lo pide
--    (toggle "Auto Confirm User").
-- 2. Esto crea el usuario Y automáticamente su perfil como ENCARGADO (por el trigger de arriba).
-- 3. Volvé al SQL Editor y corré esto, reemplazando el email por el tuyo:
--
--    update perfiles set rol = 'ADMINISTRADOR'
--    where id = (select id from auth.users where email = 'tu-email@ejemplo.com');
--
-- Listo: ese usuario ya es Administrador. Cualquier otro usuario que crees
-- después queda como Encargado por defecto, hasta que vos lo subas de rol
-- de la misma forma.
