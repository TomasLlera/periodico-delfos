import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { ListaGoleadoras } from '@/components/temporada/ListaGoleadoras'
import type { Goleadora, Temporada } from '@/types'

/**
 * El top 5 de goleadoras de la temporada. Es el punto 5 de la portada del
 * blueprint (7.2) y sale de la vista `goleadoras`: cero mantenimiento.
 *
 * **Reusa `<ListaGoleadoras />` de la página de temporada tal cual.** La lista
 * ya es una `<ol>` —el orden *es* el dato—, ya resuelve la foto que falta y ya
 * dice cuántos goles fueron de penal; lo único que cambia entre la portada y
 * la pestaña de la temporada es cuántas filas entran, y eso lo decide quien
 * consulta. Una variante corta habría sido el mismo componente con otro
 * nombre.
 *
 * **Sin goleadoras no se dibuja nada.** La lista tiene su estado vacío escrito
 * —"todavía no hay goles cargados"—, que es lo correcto en la pestaña de la
 * temporada, donde el lector fue a buscar eso; en la portada, un bloque que
 * sólo dice que no hay datos ocupa el lugar de las notas, que sí hay.
 */
interface Props {
  goleadoras: readonly Goleadora[]
  temporada?: Temporada | null
  /** 5 en la portada; la pestaña de la temporada pide 25. */
  limite?: number
}

export function Goleadoras({ goleadoras, temporada = null, limite = 5 }: Props) {
  const top = goleadoras.slice(0, limite)

  if (top.length === 0) return null

  return (
    <section aria-labelledby="goleadoras" className="mt-14">
      <CabeceraBloque
        id="goleadoras"
        titulo="Goleadoras"
        enlace={
          temporada
            ? {
                href: `/temporada/${temporada.slug}?ver=goleadoras`,
                texto: 'La tabla completa',
              }
            : undefined
        }
      />

      <ListaGoleadoras goleadoras={top} temporada={temporada?.nombre ?? 'la temporada'} />
    </section>
  )
}
