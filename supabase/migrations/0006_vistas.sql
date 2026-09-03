-- 0006_vistas.sql
-- Las estadísticas se calculan, nunca se escriben a mano. Estas dos vistas son
-- las que responden "¿cuántos goles lleva Cortadi esta temporada?".
--
-- security_invoker = on: sin esto las vistas correrían con los permisos del
-- owner y saltearían las políticas RLS de las tablas base.

-- ============================================
-- Goleadoras por temporada
-- ============================================

create view goleadoras with (security_invoker = on) as
select
  p.temporada_id,
  e.jugadora_id,
  j.nombre,
  j.apellido,
  j.slug,
  j.foto_url,
  count(*)                                      as goles,
  count(*) filter (where e.tipo = 'gol_penal')  as de_penal
from eventos e
join partidos  p  on p.id  = e.partido_id
join jugadoras j  on j.id  = e.jugadora_id
join equipos   eq on eq.id = e.equipo_id and eq.es_aldosivi
where e.tipo in ('gol', 'gol_penal')            -- gol_en_contra queda afuera a propósito
group by p.temporada_id, e.jugadora_id, j.nombre, j.apellido, j.slug, j.foto_url;

-- ============================================
-- Estadísticas completas por jugadora y temporada
-- ============================================

create view estadisticas_jugadora with (security_invoker = on) as
select
  f.jugadora_id,
  p.temporada_id,
  count(*)                              as partidos,
  count(*) filter (where f.es_titular)  as titular,
  sum(coalesce(g.goles, 0))::int        as goles,
  sum(coalesce(t.amarillas, 0))::int    as amarillas,
  sum(coalesce(t.rojas, 0))::int        as rojas
from formaciones f
join partidos p on p.id = f.partido_id and p.estado = 'finalizado'
left join lateral (
  select count(*) as goles
  from eventos e
  where e.jugadora_id = f.jugadora_id
    and e.partido_id  = f.partido_id
    and e.tipo in ('gol', 'gol_penal')
) g on true
left join lateral (
  select
    count(*) filter (where e.tipo = 'amarilla')                  as amarillas,
    count(*) filter (where e.tipo in ('roja', 'doble_amarilla')) as rojas
  from eventos e
  where e.jugadora_id = f.jugadora_id
    and e.partido_id  = f.partido_id
) t on true
group by f.jugadora_id, p.temporada_id;
