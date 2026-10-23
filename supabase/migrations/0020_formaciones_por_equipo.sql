-- 0020_formaciones_por_equipo.sql
-- Las formaciones dejan de ser solo de Aldosivi, y el dorsal pasa a ser el de
-- cada partido.
--
-- Hasta aca `jugadoras` no tenia equipo: la tabla entera era implicitamente
-- Aldosivi, y por eso la ficha de un partido solo podia mostrar una formacion.
-- Para cargar la del rival hay que poder decir de que club es cada jugadora.
--
-- El dorsal ya vivia en `formaciones` desde `0003` —el comentario de `0002` ya
-- decia que el numero cambia entre temporadas y por eso no va en `jugadoras`—
-- pero no tenia ninguna regla. Lo que agrega esta migracion es la regla que
-- faltaba: dos jugadoras del mismo equipo no pueden usar el mismo numero en el
-- mismo partido. Con eso, "que numero uso cada una en la temporada" se calcula
-- desde los partidos y no se carga en ningun lado.

-- ============================================
-- 1. Las jugadoras tienen equipo
-- ============================================

alter table jugadoras
  add column equipo_id uuid references equipos(id) on delete restrict;

-- Las que ya existen son todas de Aldosivi: es la premisa con la que se
-- cargaron las cinco planillas que hay.
update jugadoras
set equipo_id = (select id from equipos where es_aldosivi limit 1);

alter table jugadoras alter column equipo_id set not null;

-- El selector de la planilla pide "las de este equipo, por apellido".
create index jugadoras_equipo_idx on jugadoras (equipo_id, apellido, nombre);

-- Una rival se carga con lo minimo que se sabe de ella: nombre y apellido. El
-- puesto es dato de la ficha propia y no se le inventa a nadie.
alter table jugadoras alter column posicion drop not null;

-- ============================================
-- 2. El equipo tambien en la formacion
-- ============================================

-- Esta duplicado respecto de `jugadoras.equipo_id` y hace falta: un indice
-- unico no puede mirar a traves de la FK, y la regla del dorsal es por equipo.
--
-- Ademas guarda el equipo con el que jugo **ese dia**, que es lo
-- historicamente cierto: si una jugadora cambia de club, los partidos viejos
-- siguen diciendo con quien jugo.
alter table formaciones
  add column equipo_id uuid references equipos(id) on delete restrict;

update formaciones f
set equipo_id = j.equipo_id
from jugadoras j
where j.id = f.jugadora_id;

alter table formaciones alter column equipo_id set not null;

create index formaciones_partido_equipo_idx on formaciones (partido_id, equipo_id);

-- ============================================
-- 3. Los partidos ya cargados estrenan numeros
-- ============================================

-- 1 a 11 para los titulares y 12 en adelante para los suplentes, en orden de
-- puesto —la arquera primero—. **Es un punto de partida para corregir, no un
-- dato real**: de los cinco partidos cargados, ninguno registro los dorsales
-- salvo uno. Sin esto, cada ficha vieja muestra veinte guiones.
--
-- Solo numera los equipos donde no hay **ningun** dorsal cargado. Rellenar fila
-- por fila metria numeros inventados en el medio de los reales y, peor, podrian
-- chocar contra los que ya estan: el partido que Charlie cargo a mano queda
-- intacto, entero.
with numerados as (
  select
    f.partido_id,
    f.jugadora_id,
    row_number() over (
      partition by f.partido_id, f.equipo_id
      order by f.es_titular desc, f.posicion nulls last, j.apellido, j.nombre
    ) as numero
  from formaciones f
  join jugadoras j on j.id = f.jugadora_id
  where not exists (
    select 1
    from formaciones x
    where x.partido_id = f.partido_id
      and x.equipo_id  = f.equipo_id
      and x.dorsal is not null
  )
)
update formaciones f
set dorsal = n.numero
from numerados n
where f.partido_id = n.partido_id
  and f.jugadora_id = n.jugadora_id;

-- ============================================
-- 4. Las reglas del dorsal, recien ahora
-- ============================================

alter table formaciones
  add constraint formaciones_dorsal_valido
  check (dorsal is null or dorsal between 1 and 99);

-- La regla que pidio Tomas: dos jugadoras del mismo equipo no pueden compartir
-- numero en el mismo partido. Que una jugadora figure dos veces en el mismo
-- partido ya lo impedia la PK `(partido_id, jugadora_id)` desde `0003`.
--
-- Si esta linea falla, hay un partido con el numero repetido y hay que mirarlo
-- a mano: la migracion corta sola y no deja nada a medias.
create unique index formaciones_dorsal_unico_idx
  on formaciones (partido_id, equipo_id, dorsal)
  where dorsal is not null;

-- ============================================
-- 5. El dorsal del plantel deja de existir
-- ============================================

-- Se va porque ahora hay una sola fuente —la formacion de cada partido— y dos
-- fuentes del mismo numero terminan contradiciendose. No se pierde nada: la
-- columna estaba vacia, 33 filas de plantel y ni un dorsal cargado en ninguna.
drop index plantel_dorsal_unico_idx;
alter table plantel drop constraint dorsal_valido;
alter table plantel drop column dorsal;
