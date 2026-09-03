-- 0003_partidos_eventos.sql
-- Partidos, alineaciones y eventos. `eventos` es la unidad mínima de dato
-- deportivo: todo lo que hoy se escribe a mano dentro del texto de una nota
-- termina siendo una fila acá.

create type estado_partido_t as enum (
  'programado','en_curso','finalizado','suspendido','postergado'
);

create table partidos (
  id                   uuid primary key default gen_random_uuid(),
  temporada_id         uuid not null references temporadas(id) on delete restrict,
  fecha_numero         int,
  fecha_hora           timestamptz not null,
  equipo_local_id      uuid not null references equipos(id) on delete restrict,
  equipo_visitante_id  uuid not null references equipos(id) on delete restrict,
  goles_local          int,
  goles_visitante      int,
  estado               estado_partido_t not null default 'programado',
  cancha               text,
  arbitra              text,
  slug                 text not null unique,  -- "fecha-11-tiburonas-all-boys-2026"
  observaciones        text,
  created_at           timestamptz not null default now(),

  constraint equipos_distintos check (equipo_local_id <> equipo_visitante_id),
  constraint goles_no_negativos check (
    (goles_local is null or goles_local >= 0) and
    (goles_visitante is null or goles_visitante >= 0)
  ),
  -- Un partido finalizado tiene resultado cargado, siempre.
  constraint finalizado_tiene_resultado check (
    estado <> 'finalizado' or (goles_local is not null and goles_visitante is not null)
  )
);

create index partidos_temporada_fecha_idx on partidos (temporada_id, fecha_numero);
create index partidos_fecha_hora_idx      on partidos (fecha_hora desc);
create index partidos_estado_idx          on partidos (estado, fecha_hora);

-- No puede haber dos partidos en la misma fecha del mismo campeonato.
create unique index partidos_fecha_unica_idx
  on partidos (temporada_id, fecha_numero)
  where fecha_numero is not null;

-- ============================================
-- Alineación: quiénes jugaron
-- ============================================

create table formaciones (
  partido_id   uuid not null references partidos(id)  on delete cascade,
  jugadora_id  uuid not null references jugadoras(id) on delete restrict,
  es_titular   boolean not null default true,
  dorsal       int,
  posicion     posicion_t,
  primary key (partido_id, jugadora_id)
);

create index formaciones_jugadora_idx on formaciones (jugadora_id);

-- ============================================
-- Eventos
-- ============================================

create type tipo_evento_t as enum (
  'gol','gol_penal','gol_en_contra','penal_errado',
  'amarilla','roja','doble_amarilla',
  'cambio','lesion'
);

create table eventos (
  id                    uuid primary key default gen_random_uuid(),
  partido_id            uuid not null references partidos(id) on delete cascade,
  minuto                int not null,
  adicionado            int not null default 0,
  tipo                  tipo_evento_t not null,
  equipo_id             uuid not null references equipos(id) on delete restrict,
  jugadora_id           uuid references jugadoras(id) on delete restrict,  -- null si es del rival
  jugadora_nombre       text,                                              -- fallback para rivales
  jugadora_sale_id      uuid references jugadoras(id) on delete restrict,  -- sólo para 'cambio'
  jugadora_sale_nombre  text,
  detalle               text,

  constraint minuto_valido check (minuto between 0 and 120),
  constraint adicionado_valido check (adicionado between 0 and 30),
  -- Todo evento identifica a alguien: o es una jugadora nuestra (FK) o es una
  -- del rival (texto libre). Nunca ninguna de las dos.
  constraint evento_identifica_jugadora check (
    jugadora_id is not null or jugadora_nombre is not null
  ),
  -- Un cambio sin quién sale no es un cambio.
  constraint cambio_tiene_quien_sale check (
    tipo <> 'cambio' or jugadora_sale_id is not null or jugadora_sale_nombre is not null
  )
);

create index eventos_partido_minuto_idx on eventos (partido_id, minuto, adicionado);
create index eventos_jugadora_tipo_idx  on eventos (jugadora_id, tipo);
