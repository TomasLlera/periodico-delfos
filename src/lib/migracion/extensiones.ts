/**
 * El juego de extensiones que usa la migración para parsear el HTML de
 * WordPress con `generateJSON()`.
 *
 * No es el juego de extensiones del editor —ese va en `lib/tiptap/extensions.ts`
 * cuando se escriba el Step 7— pero **el contrato de atributos es el mismo**,
 * porque los dos tienen que producir documentos que el renderer sepa dibujar:
 *
 *     { type: 'imagen',   attrs: { src, alt, epigrafe?, credito? } }
 *     { type: 'planilla', attrs: { partidoId } }
 *
 * `planilla` no aparece acá: WordPress no tiene ese nodo y nada del HTML viejo
 * puede producirlo. Las planillas se insertan a mano desde el editor una vez
 * que los partidos estén cargados en la base.
 *
 * StarterKit trae de más (`strike`, `underline`, `codeBlock`, `code`) y de menos
 * (imágenes). Lo de más lo descarta `sanearDocumento()` en `cuerpo.ts`: es más
 * seguro parsear con un vocabulario amplio y podar después que perder texto
 * porque el parser no supo dónde ponerlo.
 */

import { Node } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import type { Extensions } from '@tiptap/core'
import { idDeAdjunto } from '@/lib/migracion/imagenes'

/** Una imagen tal como salió del HTML, antes de resolverla contra el bucket. */
export interface ImagenCruda {
  src: string
  alt: string
  /** El texto completo del `<figcaption>`, todavía sin partir en pie y crédito. */
  epigrafe: string
  /**
   * El id del adjunto, que WordPress deja en la clase `wp-image-2647`.
   *
   * Es el dato que permite ir a buscar el `alt_text` y el `source_url` a máxima
   * resolución al índice de medios, en vez de deducirlos del nombre del archivo.
   */
  wpId: number | null
}

function texto(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * La imagen del cuerpo.
 *
 * Es un `atom`: sin esto ProseMirror baja a los hijos del `<figure>` y el
 * `<figcaption>` termina convertido en un párrafo suelto abajo de la foto —que
 * es exactamente lo que hacía la prueba con StarterKit pelado, y que además
 * tiraba el `<img>` a la basura porque nadie lo reclamaba.
 *
 * Las dos reglas de parseo están ordenadas a propósito: `figure` tiene más
 * prioridad que `img` para que una foto con epígrafe se lea entera y no en dos
 * pedazos.
 */
const Imagen = Node.create({
  name: 'imagen',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      epigrafe: { default: '' },
      wpId: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        priority: 60,
        getAttrs: (elemento) => {
          if (typeof elemento === 'string') return false

          const img = elemento.querySelector('img')
          const src = img?.getAttribute('src')
          // Un `<figure>` sin imagen no es una imagen: puede ser una cita con
          // `<figcaption>`, o un embed. Devolver `false` deja que lo parseen
          // las reglas normales en vez de tragárselo.
          if (!img || !src) return false

          return {
            src,
            alt: texto(img.getAttribute('alt')),
            epigrafe: texto(elemento.querySelector('figcaption')?.textContent),
            wpId: idDeAdjunto(img.getAttribute('class')),
          } satisfies ImagenCruda
        },
      },
      {
        tag: 'img[src]',
        priority: 50,
        getAttrs: (elemento) => {
          if (typeof elemento === 'string') return false
          const src = elemento.getAttribute('src')
          if (!src) return false

          return {
            src,
            alt: texto(elemento.getAttribute('alt')),
            epigrafe: '',
            wpId: idDeAdjunto(elemento.getAttribute('class')),
          } satisfies ImagenCruda
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // Sólo existe para que el esquema de ProseMirror esté completo. La
    // migración nunca serializa de vuelta a HTML: el renderer recorre el JSON.
    return ['figure', ['img', HTMLAttributes]]
  },
})

/**
 * Las extensiones con las que se parsea el HTML viejo.
 *
 * `link` viene dentro de StarterKit en TipTap 3 y agrega `target`, `rel`,
 * `class` y `title` a cada link; `sanearDocumento()` los tira y deja sólo el
 * `href`, ya filtrado por `hrefSeguro()`.
 */
export function extensionesDeMigracion(): Extensions {
  return [StarterKit, Imagen]
}
