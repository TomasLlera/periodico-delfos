-- seed.sql — los catálogos que ninguna migración trae.
--
-- Es el paso 6 de "Arrancar el backend" (HANDOFF.md). Las nueve migraciones
-- crean el schema y nada más: sin estas filas la migración desde WordPress
-- falla, porque toda nota necesita un autor y todo partido una temporada y dos
-- equipos.
--
-- CÓMO SE CORRE. No lo aplica `supabase db push`, que sólo mira
-- `migrations/`. Va a mano, después del push:
--
--     Pegarlo entero en el SQL Editor de la consola de Supabase,
--     o: psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Es idempotente: todos los inserts son `on conflict ... do update`, así que
-- correrlo dos veces no duplica nada y sirve para corregir un dato y volver a
-- pasarlo.
--
-- ============================================================
-- El UUID del autor: ya está puesto, pero ojo si se rehace el usuario
-- ============================================================
--
-- `autores.id` es FK a `auth.users(id)`, así que **no se puede inventar**: es
-- el UUID del usuario de Authentication → Users (paso 4), ya escrito abajo.
-- Es el de la cuenta de Charlie, redondocarlosrogelio@gmail.com.
--
-- Si ese usuario se borra y se vuelve a crear, el UUID cambia y hay que
-- actualizarlo acá. Cambiarle el mail, en cambio, **no** lo cambia.
--
-- Acá va **sólo el autor del medio**. Las otras cuentas con acceso al panel
-- —la del operador técnico, la de `scripts/usuario-e2e.ts`— también necesitan
-- fila en `autores`, porque es lo que el panel exige, pero no son parte del
-- estado base del proyecto y no se recrean desde este archivo.
--
-- Si el usuario no existiera, este archivo falla entero en el primer insert y
-- no escribe nada — que es lo que tiene que pasar.

begin;

-- ============================================
-- Autores
-- ============================================
--
-- `slug` tiene que ser 'charlie-redondo' o hay que pasarle `--autor <slug>` a
-- scripts/migrate-wp.ts, que lo busca por slug para firmar las 70 notas.
--
-- `bio`, `foto_url`, `instagram` y `x_handle` quedan en null a propósito: son
-- datos que sólo tiene Charlie y que todavía no dio. La ficha de autor los
-- muestra si están y los omite si no.

insert into autores (id, nombre, slug)
values (
  'edea49e8-c628-4d29-b623-1febd6adde95',  -- UUID del usuario de Auth (paso 4)
  'Charlie Redondo',
  'charlie-redondo'
)
on conflict (id) do update
  set nombre = excluded.nombre,
      slug   = excluded.slug;

-- ============================================
-- Temporadas
-- ============================================
--
-- OJO con `temporadas_una_activa_idx`: es un índice único parcial
-- (`on temporadas (activa) where activa`), así que **sólo una fila puede tener
-- activa = true**. La barra de estado de la portada y el fixture por omisión
-- dependen de que sea inequívoco.
--
-- Por eso se apagan todas antes de insertar: si se corre este archivo cuando
-- ya hay una activa distinta, el insert chocaría contra el índice.

update temporadas set activa = false where activa;

insert into temporadas (nombre, slug, division, anio, zona, activa)
values
  ('Primera B 2026', 'primera-b-2026', 'Primera B', 2026, 'Zona B', true),
  -- El torneo que ganaron. Las crónicas de octubre que trae la migración
  -- ("Tiburonas Campeonas") son de esta temporada, así que tiene que existir
  -- para que esas notas puedan colgarse de algún lado.
  ('Primera C 2024', 'primera-c-2024', 'Primera C', 2024, null, false)
on conflict (slug) do update
  set nombre   = excluded.nombre,
      division = excluded.division,
      anio     = excluded.anio,
      zona     = excluded.zona,
      activa   = excluded.activa;

-- ============================================
-- Equipos
-- ============================================
--
-- Los diez de la Zona B 2026. Nombres y ciudades reales — salen de las fichas
-- de partido, no están inventados. `ciudad` va sólo donde alguna ficha la dice;
-- null no es un dato faltante por descuido.
--
-- OJO con `equipos_un_aldosivi_idx`, el otro índice único parcial: **un solo
-- equipo puede tener es_aldosivi = true**. Las vistas de goleadoras y
-- estadísticas filtran por esa columna y dos filas romperían los conteos.
--
-- Hoy `es_aldosivi` es el "equipo de la casa" y el sitio entero gira alrededor
-- de él: ladosDelPartido() lo pone siempre primero, resultadoParaAldosivi()
-- decide victoria/derrota desde ahí, y los tres widgets deportivos lo asumen.
-- Cuando el medio escale a más equipos, este booleano es el punto de pivote.
--
-- `escudo_url` queda en null para todos: el bucket `media` lo crea recién
-- migrate-wp.ts, y no hay escudos cargados. EscudoEquipo.tsx cae a las
-- iniciales mientras tanto, así que el sitio se ve bien sin ellos.

insert into equipos (nombre, nombre_corto, apodo, slug, ciudad, es_aldosivi)
values
  ('Club Atlético Aldosivi',  'Aldosivi',         'Las Tiburonas', 'aldosivi',         'Mar del Plata', true),
  ('Defensores de Belgrano',  'Defensores',       null,            'defensores',       'CABA',          false),
  ('Club Atlético All Boys',  'All Boys',         null,            'all-boys',         'CABA',          false),
  ('Defensa y Justicia',      'Defensa',          null,            'defensa',          null,            false),
  ('Club Atlético Claypole',  'Claypole',         null,            'claypole',         null,            false),
  ('UAI Urquiza',             'UAI Urquiza',      null,            'uai-urquiza',      'Villa Lynch',   false),
  ('Club Deportivo Morón',    'Dep. Morón',       null,            'dep-moron',        null,            false),
  ('Club Comunicaciones',     'Comunicaciones',   null,            'comunicaciones',   'CABA',          false),
  ('Estrella del Sur',        'Estrella del Sur', null,            'estrella-del-sur', null,            false),
  ('Rosario Central',         'Central',          null,            'central',          'Rosario',       false)
on conflict (slug) do update
  set nombre       = excluded.nombre,
      nombre_corto = excluded.nombre_corto,
      apodo        = excluded.apodo,
      ciudad       = excluded.ciudad,
      es_aldosivi  = excluded.es_aldosivi;

commit;

-- ============================================
-- Verificación
-- ============================================
--
-- Correr esto después y leer las tres filas. Si alguna no da lo esperado, la
-- migración del paso 7 va a fallar o a cargar mal:
--
--   select 'autores' as tabla, count(*)::text as valor from autores
--   union all
--   select 'temporada activa', coalesce((select slug from temporadas where activa), 'NINGUNA')
--   union all
--   select 'equipos / aldosivi',
--          (select count(*) from equipos)::text || ' / ' ||
--          (select count(*) from equipos where es_aldosivi)::text;
--
-- Esperado:
--   autores              1
--   temporada activa     primera-b-2026
--   equipos / aldosivi   10 / 1
