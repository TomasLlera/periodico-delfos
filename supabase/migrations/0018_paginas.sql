-- 0018_paginas.sql — las páginas fijas, editables desde el panel.
--
-- Pedido de Tomás el 06/10/2026: que Charlie pueda editar "Quiénes somos" sin
-- pedirle a nadie que toque el código. Hasta ahora ese texto vivía dentro de un
-- `.tsx`, así que corregir una coma era un commit, un PR y un deploy.
--
-- ES UNA TABLA Y NO UNA CLAVE MÁS EN `configuracion` porque lo que se guarda no
-- es un valor sino un documento: párrafos, subtítulos, negritas y links. Lo
-- guarda igual que `notas.cuerpo` —un `jsonb` de TipTap— y así reusa todo lo que
-- ya existe: el mismo editor del panel, el mismo renderer del sitio y la misma
-- validación de `esquema.ts`. Un campo de texto plano habría obligado a inventar
-- un segundo formato y un segundo renderer para la misma clase de contenido.
--
-- EL SLUG ES LA CLAVE Y NO HAY ALTA DE PÁGINAS NUEVAS. Cada fila corresponde a
-- una ruta que existe en `src/app/`, así que crear una fila desde el panel no
-- crearía una página: dejaría un texto que nadie puede ver. Las páginas las
-- agrega el código, y esta tabla guarda lo que dicen.

create table paginas (
  slug        text primary key,
  titulo      text not null,
  /** La `<meta description>` y el texto de la tarjeta al compartir. */
  descripcion text not null,
  cuerpo      jsonb not null,
  updated_at  timestamptz not null default now(),

  constraint pagina_titulo_requerido check (length(trim(titulo)) > 0),
  constraint pagina_descripcion_requerida check (length(trim(descripcion)) > 0)
);

comment on table paginas is
  'Texto de las páginas fijas. El slug corresponde a una ruta que ya existe.';

-- ============================================
-- RLS
-- ============================================

alter table paginas enable row level security;

-- Lectura pública: es el contenido de una página pública, y lo lee el cliente
-- anónimo para no volver dinámicas las rutas estáticas del sitio.
create policy lectura_publica on paginas for select using (true);

-- Escribe un editor. Es el texto institucional del medio —quiénes son, cómo
-- trabajan—, no una nota firmada, así que no es una tarea de redacción.
-- `es_editor()` viene de la 0014.
create policy escritura_editor on paginas for all
  using (es_editor())
  with check (es_editor());

-- ============================================
-- El contenido de hoy
-- ============================================

-- Se siembra con el texto que hoy está escrito en `src/app/quienes-somos/page.tsx`,
-- palabra por palabra. **No es contenido nuevo**: es el mismo, mudado de lugar,
-- para que el deploy no deje la página en blanco un rato. Desde acá lo edita
-- Charlie.
insert into paginas (slug, titulo, descripcion, cuerpo) values (
  'quienes-somos',
  'Quiénes somos',
  'Periódico Delfos cubre el fútbol femenino de Aldosivi desde Mar del Plata. Lo escribe Charlie Redondo.',
  '{
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Periódico Delfos" },
          { "type": "text", "text": " es un medio digital de Mar del Plata dedicado al fútbol femenino de Aldosivi. Cubre a las Tiburonas fecha a fecha: la crónica de cada partido, los análisis del torneo y las estadísticas de la temporada." }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Cómo se trabaja acá" }]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Lo escribe una sola persona, " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Charlie Redondo" },
          { "type": "text", "text": ". Eso define el tamaño de lo que se publica y también su ritmo: no hay cobertura minuto a minuto ni contenido de relleno entre fechas." }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Los datos del partido —goles, formaciones, tarjetas, minutos— no se escriben a mano adentro del texto de las notas. Se cargan una sola vez en una planilla y de ahí salen la ficha del partido, las estadísticas de cada jugadora y la tabla de goleadoras. Es lo que permite que una nota de hace dos temporadas siga teniendo los datos bien puestos, y que las cifras no se contradigan entre notas." }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Cada foto publicada lleva su texto alternativo y su crédito. El cuerpo de las notas se compone a una medida de lectura fija, pensada para leer ochocientas palabras en un teléfono sin cansarse." }
        ]
      }
    ]
  }'::jsonb
);

-- ============================================
-- Verificación
-- ============================================
--
--   select slug, titulo, jsonb_array_length(cuerpo->'content') as bloques
--     from paginas;
--
-- Tiene que devolver una fila, `quienes-somos`, con 5 bloques.
