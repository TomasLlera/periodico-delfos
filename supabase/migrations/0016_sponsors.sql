-- 0016_sponsors.sql — los espacios de publicidad propia.
--
-- Charlie definió el 02/10/2026 dónde van: uno arriba en la portada, otros
-- intercalados entre las filas de notas, y en las notas una barra al costado
-- derecho. Y definió también con qué empezar: **sponsors propios y no AdSense**.
--
-- POR QUÉ SPONSORS PROPIOS PRIMERO. AdSense necesita la cuenta aprobada, el
-- script de Google en todas las páginas y —lo que manda— la política de
-- privacidad publicada, porque deja cookies de terceros. Un sponsor propio es
-- una imagen, un link y una fecha de vencimiento: no deja ni una cookie, no
-- depende de que nadie apruebe nada y se puede cobrar desde el primer día. El
-- día que entre AdSense, estos huecos ya van a estar donde tienen que estar.
--
-- ES UNA TABLA Y NO UNA CONSTANTE EN EL CÓDIGO porque una campaña empieza y
-- termina en una fecha, y nadie va a abrir un pull request para sacar un banner
-- que venció el domingo.

-- ============================================
-- Dónde puede ir un sponsor
-- ============================================

-- Los tres huecos que pidió Charlie. Es un enum y no texto libre porque cada
-- valor tiene un componente que lo dibuja: un hueco inventado desde el panel no
-- se vería en ningún lado y nadie entendería por qué.
create type ubicacion_sponsor as enum (
  'portada_arriba',
  'portada_entre_notas',
  'nota_lateral'
);

create table sponsors (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  imagen_url   text not null,
  alt          text not null,
  link         text,
  ubicacion    ubicacion_sponsor not null,
  desde        date not null default current_date,
  hasta        date,
  orden        integer not null default 0,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Regla no negociable 4: ninguna imagen se publica sin descripción. Es el
  -- mismo CHECK que tiene `notas.alt_requerido`, y vale igual para un logo:
  -- "Banner de Panadería San Juan" es lo que escucha quien usa lector de
  -- pantalla, y sin eso el aviso es un agujero en la lectura de la página.
  constraint sponsor_alt_requerido check (length(trim(alt)) > 0),
  constraint sponsor_nombre_requerido check (length(trim(nombre)) > 0),

  -- Una campaña que termina antes de empezar es un error de tipeo, y sin esto
  -- el banner simplemente no aparece nunca y nadie sabe por qué.
  constraint sponsor_vigencia_coherente check (hasta is null or hasta >= desde)
);

comment on table sponsors is
  'Publicidad propia. La vigencia la decide `desde`/`hasta`, no un borrado.';

comment on column sponsors.hasta is
  'Último día que se muestra, inclusive. Null: sin fecha de fin.';

comment on column sponsors.orden is
  'Entre varios sponsors del mismo hueco, el más chico va primero.';

-- Los huecos se consultan por ubicación y filtrando los vigentes, que es
-- exactamente este índice.
create index sponsors_hueco_idx on sponsors (ubicacion, activo, desde, hasta);

-- ============================================
-- RLS
-- ============================================

alter table sponsors enable row level security;

-- **La lectura pública muestra sólo los vigentes**, y es a propósito que el
-- filtro esté acá y no sólo en la query: la anon key viaja en el bundle, así
-- que cualquiera puede listar la tabla entera. Sin esta condición, el contrato
-- de un sponsor que todavía no arrancó —o el de uno que ya venció— queda a la
-- vista de la competencia con sólo mirar la red.
--
-- La fecha se calcula en el huso de Mar del Plata y no en el del servidor:
-- Supabase corre en UTC, y una campaña que vence "el domingo" no puede
-- apagarse a las nueve de la noche del sábado.
create policy lectura_vigentes on sponsors for select
  using (
    activo
    and desde <= (now() at time zone 'America/Argentina/Buenos_Aires')::date
    and (hasta is null or hasta >= (now() at time zone 'America/Argentina/Buenos_Aires')::date)
  );

-- Un editor ve todos —incluidos los que no arrancaron y los vencidos— y es el
-- único que los carga. Vender un espacio no es una tarea de redacción.
-- `es_editor()` viene de la 0014.
create policy gestion_editor on sponsors for all
  using (es_editor())
  with check (es_editor());

-- ============================================
-- Verificación
-- ============================================
--
-- Un sponsor de prueba, vencido, no tiene que verse desde el sitio público:
--
--   insert into sponsors (nombre, imagen_url, alt, ubicacion, desde, hasta)
--   values ('Prueba', 'https://x/y.webp', 'Banner de prueba', 'portada_arriba',
--           current_date - 10, current_date - 1);
--
--   -- Con la anon key, esto tiene que devolver cero filas:
--   select count(*) from sponsors;
