/**
 * Arma la nota que la vista previa le pasa a `<ArticuloNota />`.
 *
 * La preview existe para que Charlie mire cómo va a quedar **antes** de
 * escribir nada: hoy, para ver una nota terminada hay que publicarla, mirarla y
 * despublicarla si no gusta, y eso deja la nota publicada durante unos
 * segundos y dispara el auto-posteo a las redes.
 *
 * Por eso esto no toca la base ni Storage. Toma lo que hay en el formulario y
 * lo completa con lo único que la nota guardada tendría de más —un id, una
 * fecha de publicación, el autor y las relaciones ya resueltas— para que el
 * componente del sitio la reciba como recibe cualquier otra.
 *
 * **Se renderiza con los mismos componentes que el sitio público**, no con una
 * copia. `<ArticuloNota />` ya es puro y sincrónico —recibe todo por props y no
 * consulta nada—, así que anda igual dentro de un árbol cliente. Si la preview
 * y la nota publicada alguna vez se ven distinto, el bug está en el contrato de
 * `src/lib/tiptap/esquema.ts` o acá, nunca en un markup paralelo: no lo hay.
 */

import type { EntradaNota } from '@/lib/nota'
import type {
  Autor,
  Nota,
  NotaConRelaciones,
  PartidoConEquipos,
  Temporada,
} from '@/types'

/**
 * El id que lleva una nota que todavía no existe.
 *
 * Es una constante y no un uuid al azar a propósito: así el árbol que React
 * dibuja no cambia entre dos aperturas de la preview, y si este id aparece
 * alguna vez en la base, es que algo la guardó y hay un bug que encontrar.
 */
export const ID_VISTA_PREVIA = 'vista-previa'

/** La nota guardada, cuando se está editando una que ya existe. */
type NotaExistente = Pick<Nota, 'id' | 'estado' | 'publicada_en' | 'created_at'>

interface Params {
  entrada: EntradaNota
  autor: Autor
  /** Ya resuelta por el formulario a partir de `temporada_id`. */
  temporada?: Temporada | null
  /** Ya resuelto por el formulario a partir de `partido_id`. */
  partido?: PartidoConEquipos | null
  /** La fila que ya está en la base, si se edita. `null` al crear. */
  existente?: NotaExistente | null
  /** Inyectable para poder testear la fecha. */
  ahora?: Date
}

export function notaDePrevisualizacion({
  entrada,
  autor,
  temporada = null,
  partido = null,
  existente = null,
  ahora = new Date(),
}: Params): NotaConRelaciones {
  const momento = ahora.toISOString()

  return {
    ...entrada,

    id: existente?.id ?? ID_VISTA_PREVIA,
    autor_id: autor.id,

    // El estado real, si la nota ya existe. Editar una publicada es una versión
    // nueva sobre algo vivo, y la preview no la degrada a borrador.
    estado: existente?.estado ?? 'borrador',

    // Una nota sin publicar no tiene fecha, pero la línea de autor la muestra.
    // Se usa ahora, que es exactamente la que tendría si se confirmara: la
    // preview promete cómo va a quedar, no cómo está.
    publicada_en: existente?.publicada_en ?? momento,

    created_at: existente?.created_at ?? momento,
    updated_at: momento,

    autor,
    temporada,
    partido,
  }
}

/**
 * `true` si lo que se está previsualizando es una versión nueva de una nota que
 * ya está publicada en el sitio.
 *
 * Lo usa el banner: no es lo mismo mirar un borrador que todavía no vio nadie
 * que mirar cambios sobre una nota que ahora mismo está en la portada.
 */
export function esSobrePublicada(existente?: NotaExistente | null): boolean {
  return existente?.estado === 'publicada'
}
