-- 0019_pagina_contacto.sql — Contacto también se edita desde el panel.
--
-- Misma tabla que "Quiénes somos" (ver `0018_paginas.sql`): una fila más, sin
-- esquema nuevo. Es la prueba de que la tabla estaba bien pensada — agregar una
-- página editable cuesta un `insert` y cambiar una página a que lea de la base.
--
-- QUÉ ENTRA ACÁ Y QUÉ NO. El cuerpo guarda **sólo el texto**: qué conviene
-- mandar al medio. No entran ni el mail ni la lista de redes, y es a propósito:
--
-- - El mail sale de `MAIL_DEL_MEDIO` (`src/lib/sitio.ts`), que es la misma
--   constante que cita la política de privacidad. Si viviera además como texto
--   acá, el día que cambie habría que acordarse de los dos lugares, y el que se
--   olvide publica una dirección muerta en un documento legal.
-- - Las cuentas de redes salen de `redesDelMedio()`, que lee el entorno. Son las
--   mismas que la tira de arriba y el pie.
--
-- Las dos cosas las dibuja la página alrededor del texto editable. Charlie
-- escribe lo que hay que escribir y los datos se mantienen solos.

insert into paginas (slug, titulo, descripcion, cuerpo) values (
  'contacto',
  'Contacto',
  'Escribile a Periódico Delfos. Datos, correcciones y lo que falte sobre el fútbol femenino de Aldosivi.',
  '{
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Qué conviene mandar por ahí" }]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Correcciones." },
          { "type": "text", "text": " Si un dato de una nota está mal —un gol mal adjudicado, un nombre mal escrito, un minuto cambiado—, decilo. Los datos del partido salen de una planilla y corregirlos ahí arregla la nota, la ficha del partido y las estadísticas de la jugadora de una sola vez, incluso en notas publicadas hace meses." }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Datos y fotos de los partidos." },
          { "type": "text", "text": " El medio lo escribe una sola persona y no llega a todas las canchas. Las formaciones, los goles con su minuto y las fotos de las fechas que no se cubrieron son bienvenidas, con el crédito de quien las sacó." }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Cualquier cosa sobre el fútbol femenino de Aldosivi" },
          { "type": "text", "text": " que debería estar publicada y no está." }
        ]
      }
    ]
  }'::jsonb
);

-- ============================================
-- Verificación
-- ============================================
--
--   select slug, titulo from paginas order by slug;
--
-- Tienen que estar las dos: `contacto` y `quienes-somos`.
