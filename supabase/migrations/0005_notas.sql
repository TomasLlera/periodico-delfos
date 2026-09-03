-- 0005_notas.sql
-- Contenido editorial. El cuerpo es TipTap JSON, no HTML crudo.

create type categoria_t   as enum ('cronica','analisis','temporada','plantel','institucional');
create type estado_nota_t as enum ('borrador','publicada','archivada');

create table notas (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,            -- SIN el sufijo "Fecha N - Aldosivi..."
  slug            text not null unique,
  bajada          text not null,            -- extracto escrito a mano, OBLIGATORIO
  cuerpo          jsonb not null,           -- TipTap JSON
  imagen_portada  text,
  imagen_alt      text not null default '',
  imagen_credito  text,
  categoria       categoria_t not null,
  temporada_id    uuid references temporadas(id) on delete set null,
  partido_id      uuid references partidos(id)   on delete set null,
  autor_id        uuid not null references autores(id) on delete restrict,
  estado          estado_nota_t not null default 'borrador',
  publicada_en    timestamptz,
  destacada       boolean not null default false,

  -- Distribución automática a redes
  auto_post       boolean not null default true,
  redes           text[]  not null default '{facebook,instagram,x}',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- La bajada es obligatoria de verdad: no alcanza con NOT NULL, WordPress ya
  -- demostró que un extracto vacío se llena con basura truncada.
  constraint bajada_no_vacia check (length(trim(bajada)) > 0),
  constraint titulo_no_vacio check (length(trim(titulo)) > 0),

  -- Regla no negociable #10: si hay imagen, hay alt. Se valida en el formulario
  -- con Zod y acá abajo, porque el formulario se puede saltear.
  constraint alt_requerido check (
    imagen_portada is null or length(trim(imagen_alt)) > 0
  ),

  constraint publicada_tiene_fecha check (
    estado <> 'publicada' or publicada_en is not null
  ),

  constraint redes_validas check (
    redes <@ array['facebook','instagram','x']::text[]
  )
);

create index notas_estado_pub_idx  on notas (estado, publicada_en desc);
create index notas_categoria_idx   on notas (categoria, publicada_en desc);
create index notas_temporada_idx   on notas (temporada_id, publicada_en desc);
create index notas_partido_idx     on notas (partido_id);
create index notas_destacada_idx   on notas (destacada, publicada_en desc) where destacada;

create trigger notas_updated_at
  before update on notas
  for each row execute function set_updated_at();
