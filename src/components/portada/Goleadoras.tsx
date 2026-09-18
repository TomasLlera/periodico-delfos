import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { ListaGoleadoras } from '@/components/temporada/ListaGoleadoras'
import type { Goleadora, Temporada } from '@/types'

/**
 * El top 5 de goleadoras de la temporada, para la portada.
 *
 * Las filas son las mismas de `/temporada/[slug]`: la lista completa y el
 * recorte de la portada no son dos diseños, son el mismo componente con menos
 * filas y un link a la lista entera.
 *
 * **El corte en 5 lo hace este bloque y no quien lo llama.** El widget se
 * define como "top 5" en el blueprint; si el día de mañana la query cambia de
 * límite, la portada no se convierte en una tabla de goleadoras de 30 filas.
 */
const TOP = 5

interface Props {
  id: string
  goleadoras: readonly Goleadora[]
  temporada: Temporada
}

export function Goleadoras({ id, goleadoras, temporada }: Props) {
  return (
    <section aria-labelledby={id} className="mt-14">
      <CabeceraBloque
        id={id}
        titulo="Goleadoras"
        enlace={{
          href: `/temporada/${temporada.slug}?ver=goleadoras`,
          texto: 'La tabla completa',
        }}
      />

      <ListaGoleadoras
        goleadoras={goleadoras.slice(0, TOP)}
        temporada={temporada.nombre}
      />
    </section>
  )
}
