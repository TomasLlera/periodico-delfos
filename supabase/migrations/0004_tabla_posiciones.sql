-- 0004_tabla_posiciones.sql
--
-- DECISIÓN DELIBERADA: esta tabla NO se calcula desde `partidos`.
-- El medio sólo cubre a Aldosivi, no todos los partidos de la zona; calcularla
-- requeriría cargar el campeonato entero. Se carga a mano por fecha desde el
-- admin. Es la única excepción a la regla de "ningún dato deportivo a mano",
-- y está acotada a una tabla — nunca al texto de una nota.
--
-- Los CHECK de abajo existen porque la carga es manual: son la red que atrapa
-- el error de tipeo antes de que llegue a la portada.

create table tabla_posiciones (
  id            uuid primary key default gen_random_uuid(),
  temporada_id  uuid not null references temporadas(id) on delete cascade,
  fecha_numero  int not null,
  equipo_id     uuid not null references equipos(id) on delete restrict,
  posicion      int not null,
  puntos        int not null,
  jugados       int not null,
  ganados       int not null,
  empatados     int not null,
  perdidos      int not null,
  goles_favor   int not null,
  goles_contra  int not null,

  unique (temporada_id, fecha_numero, equipo_id),

  constraint valores_no_negativos check (
    posicion > 0 and puntos >= 0 and jugados >= 0 and
    ganados >= 0 and empatados >= 0 and perdidos >= 0 and
    goles_favor >= 0 and goles_contra >= 0
  ),
  constraint partidos_cuadran check (jugados = ganados + empatados + perdidos),
  constraint puntos_cuadran   check (puntos = ganados * 3 + empatados)
);

create index tabla_posiciones_temporada_idx
  on tabla_posiciones (temporada_id, fecha_numero desc, posicion);

-- Dos equipos no pueden ocupar la misma posición en la misma fecha.
create unique index tabla_posiciones_posicion_unica_idx
  on tabla_posiciones (temporada_id, fecha_numero, posicion);
