/**
 * Documentos falsos para ver `<CuerpoTipTap />` sin Supabase.
 *
 * `cuerpoCompleto` ejercita todos los nodos y marcas que el renderer soporta.
 * `cuerpoHostil` junta todo lo que tiene que ignorar sin romperse.
 *
 * Este archivo y la página que lo usa se borran cuando haya notas reales en la
 * base (Step 6 del Build Order).
 */

import type { DocumentoTipTap, NodoTipTap } from '@/types'

/** Atajo para no repetir `{ type: 'text', text: … }` en cada renglón. */
function texto(text: string, marks?: NodoTipTap['marks']): NodoTipTap {
  return marks ? { type: 'text', text, marks } : { type: 'text', text }
}

function parrafo(...content: NodoTipTap[]): NodoTipTap {
  return { type: 'paragraph', content }
}

function item(...content: NodoTipTap[]): NodoTipTap {
  return { type: 'listItem', content: [parrafo(...content)] }
}

const FOTO = 'https://proyecto.supabase.co/storage/v1/object/public/media/demo/festejo.jpg'

/** Una crónica con todos los nodos. `par-fecha-11` sale de `datos-demo.ts`. */
export const cuerpoCompleto: DocumentoTipTap = {
  type: 'doc',
  content: [
    parrafo(
      texto('Aldosivi se lo dio vuelta en el segundo tiempo y volvió a meterse en la pelea por el reducido. '),
      texto('Ganó 2 a 1', [{ type: 'bold' }]),
      texto(' con un penal de Garro a los 67 minutos, en una tarde larga en el Minella.'),
    ),

    parrafo(
      texto('La crónica completa de la fecha anterior está en '),
      texto('el 2 a 1 en City Bell', [
        { type: 'link', attrs: { href: '/nota/fecha-10-estudiantes-aldosivi' } },
      ]),
      texto(', y el fixture entero en '),
      texto('la página de la temporada', [
        { type: 'link', attrs: { href: '/temporada/primera-b-2026' } },
      ]),
      texto('.'),
    ),

    { type: 'heading', attrs: { level: 2 }, content: [texto('El primer tiempo')] },

    parrafo(
      texto('Cortadi abrió a los 23 después de una contra larga. All Boys empató a los 41 y el '),
      texto('penal errado', [{ type: 'italic' }]),
      texto(' sobre el cierre dejó el 1 a 1 al descanso.'),
    ),

    {
      type: 'imagen',
      attrs: {
        src: FOTO,
        alt: 'Lucía Cortadi festeja el primer gol con las dos manos en alto frente a la tribuna',
        epigrafe: 'El 1 a 0, a los 23 minutos del primer tiempo.',
        credito: 'Foto: Charlie Redondo',
      },
    },

    { type: 'heading', attrs: { level: 3 }, content: [texto('Lo que cambió en el entretiempo')] },

    parrafo(texto('Tres retoques que ordenaron el mediocampo:')),

    {
      type: 'bulletList',
      content: [
        item(texto('Acosta por Larea a los 58, para ganar la segunda pelota.')),
        item(
          texto('Sosa'),
          texto(' pasó a jugar cinco metros más adelante.'),
        ),
        item(texto('La línea de cuatro se corrió al medio para achicar el fondo.')),
      ],
    },

    parrafo(texto('El orden en que llegaron los goles:')),

    {
      type: 'orderedList',
      content: [
        item(texto('Cortadi, 23′.')),
        item(texto('Ledesma —All Boys—, 41′.')),
        item(texto('Garro, de penal, 67′.')),
      ],
    },

    {
      type: 'blockquote',
      content: [
        parrafo(
          texto('Nos costó veinte minutos entender el partido. Después no lo soltamos más.'),
        ),
        parrafo(texto('— Declaraciones del DT, en el vestuario.')),
      ],
    },

    { type: 'horizontalRule' },

    { type: 'heading', attrs: { level: 2 }, content: [texto('La planilla')] },

    parrafo(
      texto('Los datos del partido no están escritos acá adentro: salen de la base y se '),
      texto('renderizan', [{ type: 'code' }]),
      texto(' desde el nodo '),
      texto('planilla', [{ type: 'code' }]),
      texto(', que sólo guarda el id.'),
    ),

    { type: 'planilla', attrs: { partidoId: 'par-fecha-11' } },

    { type: 'heading', attrs: { level: 2 }, content: [texto('Lo que viene')] },

    parrafo(
      texto('El próximo domingo, otra vez de local, con Deportivo Español como rival'),
      { type: 'hardBreak' },
      texto('y la chance de quedar a dos puntos de la punta.'),
    ),

    parrafo(
      texto('Dudas, correcciones o datos: '),
      texto('redaccion@periodicodelfos.com', [
        { type: 'link', attrs: { href: 'mailto:redaccion@periodicodelfos.com' } },
      ]),
      texto('. También estamos en '),
      texto('Instagram', [
        { type: 'link', attrs: { href: 'https://instagram.com/periodicodelfos' } },
      ]),
      texto('.'),
    ),

    // TipTap deja siempre un párrafo vacío al final. No tiene que dibujar nada.
    { type: 'paragraph' },
  ],
}

/**
 * Todo lo que el renderer tiene que descartar sin dejar de dibujar el resto.
 * Si esta página se ve entera, la nota sobrevive a un cuerpo mal cargado.
 */
export const cuerpoHostil: DocumentoTipTap = {
  type: 'doc',
  content: [
    parrafo(texto('Debajo de este párrafo hay ocho nodos rotos. No se ve ninguno.')),

    // 1. Link con esquema prohibido: queda el texto, se cae el link.
    parrafo(
      texto('Un link a '),
      texto('javascript:alert(1)', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]),
      texto(' sale como texto plano, sin ancla.'),
    ),

    // 2. Link protocolo-relativo: una URL externa disfrazada de ruta interna.
    parrafo(
      texto('Lo mismo con '),
      texto('//evil.example', [{ type: 'link', attrs: { href: '//evil.example/x' } }]),
      texto('.'),
    ),

    // 3. Imagen sin alt: regla no negociable 4, se descarta entera.
    { type: 'imagen', attrs: { src: FOTO } },

    // 4. Imagen con src data:.
    { type: 'imagen', attrs: { src: 'data:image/svg+xml,<svg onload=alert(1)>', alt: 'Un alt' } },

    // 5. Planilla sin partidoId.
    { type: 'planilla', attrs: {} },

    // 6. Planilla de un partido que la página no precargó.
    { type: 'planilla', attrs: { partidoId: 'par-que-no-existe' } },

    // 7. Nodo de una extensión que no existe.
    { type: 'video', attrs: { url: 'https://youtube.com/watch?v=x' } },

    // 8. Lista vacía.
    { type: 'bulletList', content: [] },

    parrafo(texto('Y este párrafo cierra: el documento llegó hasta el final.')),
  ],
}
