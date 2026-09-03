-- 0002_jugadoras_plantel.sql
-- Jugadoras y su pertenencia al plantel de cada temporada.

create type posicion_t as enum (
  'arquera','defensora','mediocampista','delantera','dt','ayudante'
);

create table jugadoras (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  apellido          text not null,
  slug              text not null unique,
  posicion          posicion_t not null,
  fecha_nacimiento  date,
  foto_url          text,
  lugar_origen      text,
  bio               text,
  activa            boolean not null default true
);

create index jugadoras_apellido_idx on jugadoras (apellido, nombre);

-- El dorsal y hasta la posición pueden cambiar entre temporadas, por eso no
-- viven en `jugadoras`.
create table plantel (
  temporada_id  uuid not null references temporadas(id) on delete cascade,
  jugadora_id   uuid not null references jugadoras(id)  on delete cascade,
  dorsal        int,
  posicion      posicion_t,
  capitana      boolean not null default false,
  primary key (temporada_id, jugadora_id),
  constraint dorsal_valido check (dorsal is null or dorsal between 1 and 99)
);

-- Dos jugadoras no pueden compartir dorsal en la misma temporada.
create unique index plantel_dorsal_unico_idx
  on plantel (temporada_id, dorsal)
  where dorsal is not null;
