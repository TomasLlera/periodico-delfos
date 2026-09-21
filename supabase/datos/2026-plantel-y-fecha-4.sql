-- 2026-plantel-y-fecha-4.sql
-- El plantel 2026 y el primer partido cargado de verdad.
--
-- **Nada de esto está inventado.** Sale de dos notas publicadas del sitio
-- viejo, que están bajadas en `.migracion-wp/`:
--
--   · `plantel-2026-de-las-tiburonas` — las 32 jugadoras con su posición.
--   · `tiburonas-6-1-claypole-fecha-n4-aldosivi-femenino-en-la-primera-b-2026`
--     — la ficha del partido, la formación, los suplentes y los goles.
--
-- Es la regla no negociable 2 aplicada al revés: esos datos hoy viven tipeados
-- adentro del texto de las crónicas, y esto es el trabajo de sacarlos de ahí y
-- ponerlos donde van.
--
-- CÓMO SE CORRE. No es una migración —no cambia el schema— así que no va en
-- `migrations/` y `db push` no lo mira:
--
--     npx --no-install supabase db query --linked -f supabase/datos/2026-plantel-y-fecha-4.sql
--
-- Es idempotente: todo es `on conflict`, así que correrlo dos veces no duplica
-- nada y sirve para corregir un dato y volver a pasarlo.
--
-- ============================================================
-- LO QUE FALTA Y NO SE PUEDE DEDUCIR
-- ============================================================
--
-- 1. **Los minutos de los seis goles.** La crónica los lista sin minuto
--    ("Goles: Larea, dos veces, Gutiérrez, Camacho, Nielsen, Contín"), y
--    `eventos.minuto` es `not null` con un CHECK de 0 a 120. Inventarlos sería
--    escribir un dato deportivo falso que después se dibuja en la línea de
--    tiempo del partido. **Por eso este archivo no carga ni un evento**, y la
--    vista `goleadoras` va a seguir vacía hasta que estén.
--
-- 2. **La hora del partido.** La ficha dice "18:80", que no existe. Es un typo
--    del sitio viejo. Abajo quedó en 18:00 y está marcado: confirmar antes de
--    aplicar.
--
-- 3. **Cómo se escribe la arquera.** La ficha del partido dice "Katkjia
--    Velardez" y la nota del plantel dice "Katja Veñardez". Es la misma
--    persona. Acá se usó la de la nota del plantel, que es la que el medio
--    publicó como listado oficial.

begin;

-- ============================================
-- Jugadoras
-- ============================================
--
-- Las 32 del plantel 2026, más el DT. El enum `posicion_t` tiene 'dt' a
-- propósito: el cuerpo técnico también es plantel.
--
-- `nombre` y `apellido` van separados porque la ficha de jugadora los usa por
-- separado y porque ordenar por apellido es lo que hace legible un plantel.

insert into jugadoras (nombre, apellido, slug, posicion) values
  -- Arqueras
  ('Agustina',  'Díaz',       'agustina-diaz',      'arquera'),
  ('Katja',     'Veñardez',   'katja-venardez',     'arquera'),
  ('Luna',      'Vera',       'luna-vera',          'arquera'),
  -- Defensoras
  ('Sol',       'Cassarino',  'sol-cassarino',      'defensora'),
  ('Sol',       'Contrera',   'sol-contrera',       'defensora'),
  ('Selene',    'Corona',     'selene-corona',      'defensora'),
  ('Agustina',  'Cuello',     'agustina-cuello',    'defensora'),
  ('Juana',     'García',     'juana-garcia',       'defensora'),
  ('Laura',     'Ghiglione',  'laura-ghiglione',    'defensora'),
  ('Delfina',   'González',   'delfina-gonzalez',   'defensora'),
  ('Julieta',   'Nielsen',    'julieta-nielsen',    'defensora'),
  ('Rebeca',    'Raimman',    'rebeca-raimman',     'defensora'),
  ('Luna',      'Sahakian',   'luna-sahakian',      'defensora'),
  -- Mediocampistas
  ('Angelina',  'Audicana',   'angelina-audicana',  'mediocampista'),
  ('Nadia',     'Auzmendi',   'nadia-auzmendi',     'mediocampista'),
  ('Ailen',     'Camacho',    'ailen-camacho',      'mediocampista'),
  ('Mora',      'Camino',     'mora-camino',        'mediocampista'),
  ('Guadalupe', 'Contín',     'guadalupe-contin',   'mediocampista'),
  ('Lorena',    'Cortadi',    'lorena-cortadi',     'mediocampista'),
  ('Griselda',  'Garro',      'griselda-garro',     'mediocampista'),
  ('Lara',      'González',   'lara-gonzalez',      'mediocampista'),
  ('Daiana',    'González',   'daiana-gonzalez',    'mediocampista'),
  ('Rocío',     'Gutiérrez',  'rocio-gutierrez',    'mediocampista'),
  ('Delfina',   'Morán',      'delfina-moran',      'mediocampista'),
  ('Johana',    'Surban',     'johana-surban',      'mediocampista'),
  -- Delanteras
  ('Ludmila',   'Acosta',     'ludmila-acosta',     'delantera'),
  ('Mylena',    'Corona',     'mylena-corona',      'delantera'),
  ('Lucero',    'Giménez',    'lucero-gimenez',     'delantera'),
  ('Morena',    'Larea',      'morena-larea',       'delantera'),
  ('Victoria',  'Mozquera',   'victoria-mozquera',  'delantera'),
  ('Morena',    'Stancato',   'morena-stancato',    'delantera'),
  ('Lucero',    'Aquino',     'lucero-aquino',      'delantera'),
  -- Cuerpo técnico
  ('Marcelo',   'Rodríguez',  'marcelo-rodriguez',  'dt')
on conflict (slug) do update
  set nombre   = excluded.nombre,
      apellido = excluded.apellido,
      posicion = excluded.posicion;

-- ============================================
-- Plantel 2026
-- ============================================
--
-- **Sin dorsal, y es deliberado.** `plantel.dorsal` es el número de la
-- temporada, y la propia nota del plantel dice que en esta categoría no hay
-- dorsales fijos: "la falta de dorsales fijos y la dificultad para trazar el
-- historial de procedencias son constantes". Los números que se conocen son
-- los de *ese* partido, y para eso existe `formaciones.dorsal`, que es por
-- partido. Poner los de la fecha 4 como dorsal de la temporada sería afirmar
-- algo que la fuente desmiente.

insert into plantel (temporada_id, jugadora_id, posicion)
select t.id, j.id, j.posicion
from temporadas t
cross join jugadoras j
where t.slug = 'primera-b-2026'
  and j.slug in (
    'agustina-diaz','katja-venardez','luna-vera',
    'sol-cassarino','sol-contrera','selene-corona','agustina-cuello','juana-garcia',
    'laura-ghiglione','delfina-gonzalez','julieta-nielsen','rebeca-raimman','luna-sahakian',
    'angelina-audicana','nadia-auzmendi','ailen-camacho','mora-camino','guadalupe-contin',
    'lorena-cortadi','griselda-garro','lara-gonzalez','daiana-gonzalez','rocio-gutierrez',
    'delfina-moran','johana-surban',
    'ludmila-acosta','mylena-corona','lucero-gimenez','morena-larea','victoria-mozquera',
    'morena-stancato','lucero-aquino',
    'marcelo-rodriguez'
  )
on conflict (temporada_id, jugadora_id) do update
  set posicion = excluded.posicion;

-- ============================================
-- El partido
-- ============================================
--
-- Primera B 2026, Zona B, fecha 4. Predio Punta Mogotes, Mar del Plata.
-- Aldosivi 6 – Claypole 1.

insert into partidos (
  temporada_id, fecha_numero, fecha_hora,
  equipo_local_id, equipo_visitante_id,
  goles_local, goles_visitante, estado, cancha, slug
)
select
  t.id,
  4,
  -- OJO: la crónica dice "18:80", que no es una hora. Confirmar antes de
  -- aplicar; mientras tanto queda en 18:00 de Argentina.
  '2026-05-09 18:00-03'::timestamptz,
  local.id,
  visitante.id,
  6, 1, 'finalizado',
  'Predio Punta Mogotes, Mar del Plata',
  'fecha-4-aldosivi-claypole-2026'
from temporadas t
join equipos local     on local.slug = 'aldosivi'
join equipos visitante on visitante.slug = 'claypole'
where t.slug = 'primera-b-2026'
on conflict (slug) do update
  set goles_local     = excluded.goles_local,
      goles_visitante = excluded.goles_visitante,
      estado          = excluded.estado,
      cancha          = excluded.cancha,
      fecha_hora      = excluded.fecha_hora;

-- ============================================
-- La formación de ese partido
-- ============================================
--
-- Once titulares y nueve suplentes, con el dorsal que usaron ese día. Claypole
-- no entra: la crónica no publicó su formación.

insert into formaciones (partido_id, jugadora_id, es_titular, dorsal, posicion)
select p.id, j.id, f.titular, f.dorsal, j.posicion
from partidos p
cross join (values
  -- Titulares
  ('katja-venardez',    1,  true),
  ('agustina-cuello',   2,  true),
  ('juana-garcia',      3,  true),
  ('daiana-gonzalez',   4,  true),
  ('ailen-camacho',     5,  true),
  ('julieta-nielsen',   6,  true),
  ('morena-larea',      7,  true),
  ('rocio-gutierrez',   8,  true),
  ('lucero-aquino',     9,  true),
  ('lorena-cortadi',    10, true),
  ('delfina-moran',     11, true),
  -- Suplentes
  ('agustina-diaz',     12, false),
  ('sol-cassarino',     13, false),
  ('luna-sahakian',     14, false),
  ('mora-camino',       15, false),
  ('griselda-garro',    16, false),
  ('morena-stancato',   17, false),
  ('guadalupe-contin',  18, false),
  ('mylena-corona',     19, false),
  ('lucero-gimenez',    20, false)
) as f(slug, dorsal, titular)
join jugadoras j on j.slug = f.slug
where p.slug = 'fecha-4-aldosivi-claypole-2026'
on conflict (partido_id, jugadora_id) do update
  set es_titular = excluded.es_titular,
      dorsal     = excluded.dorsal,
      posicion   = excluded.posicion;

-- ============================================
-- Los goles NO se cargan acá
-- ============================================
--
-- Ver la nota 1 de arriba: faltan los minutos y `eventos.minuto` es `not null`.
-- Cuando estén, son siete filas y van así —con el minuto de verdad en lugar de
-- cada `??`—:
--
--   insert into eventos (partido_id, minuto, tipo, equipo_id, jugadora_id)
--   select p.id, ??, 'gol', e.id, j.id
--   from partidos p, equipos e, jugadoras j
--   where p.slug = 'fecha-4-aldosivi-claypole-2026'
--     and e.slug = 'aldosivi' and j.slug = 'morena-larea';
--
-- Los seis de Aldosivi: Larea (dos), Gutiérrez, Camacho, Nielsen, Contín.
-- El de Claypole va sin `jugadora_id` y con `jugadora_nombre = 'Magalí
-- Riquelme'`, que es el fallback que el schema tiene previsto para rivales.

commit;

-- ============================================
-- Verificación
-- ============================================
--
--   select 'jugadoras', count(*)::text from jugadoras
--   union all select 'plantel 2026', count(*)::text from plantel p
--     join temporadas t on t.id = p.temporada_id where t.slug = 'primera-b-2026'
--   union all select 'partidos', count(*)::text from partidos
--   union all select 'formaciones', count(*)::text from formaciones;
--
-- Esperado: 33 jugadoras (32 + DT), 33 en el plantel, 1 partido, 20 formaciones.
