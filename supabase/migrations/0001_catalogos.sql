-- 0001_catalogos.sql
-- Temporadas, equipos, autores y el trigger compartido de updated_at.

-- ============================================
-- Helper compartido
-- ============================================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================
-- Temporadas
-- ============================================

create table temporadas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,                -- "Primera B 2026"
  slug        text not null unique,         -- "primera-b-2026"
  division    text not null,                -- "Primera B" | "Primera C"
  anio        int  not null,
  zona        text,                         -- "Zona B"
  activa      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Como máximo una temporada activa a la vez: la barra de estado de la portada
-- y el fixture por defecto dependen de que esto sea inequívoco.
create unique index temporadas_una_activa_idx on temporadas (activa) where activa;

-- ============================================
-- Equipos
-- ============================================

create table equipos (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,              -- "Club Atlético Aldosivi"
  nombre_corto  text not null,              -- "Aldosivi"
  apodo         text,                       -- "Tiburonas"
  slug          text not null unique,
  escudo_url    text,
  ciudad        text,
  es_aldosivi   boolean not null default false
);

-- Sólo puede haber un equipo marcado como el nuestro: las vistas de goleadoras
-- y estadísticas filtran por es_aldosivi y dos filas romperían los conteos.
create unique index equipos_un_aldosivi_idx on equipos (es_aldosivi) where es_aldosivi;

-- ============================================
-- Autores
-- ============================================

create table autores (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null,
  slug       text not null unique,
  bio        text,
  foto_url   text,
  instagram  text,
  x_handle   text
);
