-- ==========================================================================
-- T-Mirfe 2.0: tabla de aplicaciones y reglas de seguridad en Supabase.
--
-- Se pega entero en SQL Editor -> New query -> Run. Se puede volver a correr
-- sin romper nada (crea lo que falte y reemplaza reglas y funcion).
--
-- Seguridad. La app usa la clave publicable, que es publica por diseno: esta
-- en el codigo de la pagina y cualquiera puede leerla. Por eso quien la use
-- solo puede INSERTAR una aplicacion completa; no puede leer, cambiar ni
-- borrar nada. Los datos los descargan los investigadores desde el panel de
-- Supabase, con su propia cuenta.
-- ==========================================================================

create table if not exists public.aplicaciones (
  id        text primary key,
  cohorte   text not null,
  contenido jsonb not null,
  recibido  timestamptz not null default now(),
  constraint id_formato check (char_length(id) between 32 and 36),
  constraint cohorte_corta check (char_length(cohorte) between 1 and 60),
  constraint contenido_tamano check (octet_length(contenido::text) < 200000),
  -- Solo entran aplicaciones completas y con consentimiento. El "is true" final
  -- importa: en SQL una condicion desconocida (NULL) dejaria pasar el registro.
  constraint contenido_valido check ((
    contenido->>'id' = id
    and contenido->>'cohorte' = cohorte
    and (contenido->'consentimiento'->>'aceptado') = 'true'
    and case when jsonb_typeof(contenido->'ensayos') = 'array'
             then jsonb_array_length(contenido->'ensayos') = 24
             else false end
  ) is true)
);

alter table public.aplicaciones enable row level security;

-- El rol de la clave publicable (anon) solo puede insertar.
revoke all on table public.aplicaciones from anon, authenticated;
grant insert on table public.aplicaciones to anon;

drop policy if exists "la app solo inserta" on public.aplicaciones;
create policy "la app solo inserta" on public.aplicaciones
  for insert to anon with check (true);

-- Conteo por cohorte, sin exponer ningun dato de las aplicaciones. Sirve para
-- vigilar la regla de parada (400 validos o 90 dias) y como latido diario que
-- impide que el proyecto gratuito se pause por inactividad.
create or replace function public.contar_aplicaciones()
returns table (cohorte text, n bigint, primera timestamptz, ultima timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.cohorte, count(*), min(a.recibido), max(a.recibido)
  from public.aplicaciones a
  group by a.cohorte
  order by a.cohorte;
$$;

revoke all on function public.contar_aplicaciones() from public;
grant execute on function public.contar_aplicaciones() to anon;
