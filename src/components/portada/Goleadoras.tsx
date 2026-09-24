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
  const hay = goleadoras.length > 0

  return (
    <section aria-labelledby={id} className="mt-bloque">
      <CabeceraBloque
        id={id}
        titulo="Goleadoras"
        enlace={{
          href: `/temporada/${temporada.slug}?ver=goleadoras`,
          texto: 'La tabla completa',
        }}
      />

      {/* Éste es el único bloque de la portada que sí se dibuja vacío, y a
          diferencia de las notas no es por terquedad: la lista se arma sola con
          los goles de cada planilla, así que un vacío acá dice "todavía no se
          cargó ninguna planilla", que es información de verdad. Va como una
          línea de texto y no con el recuadro de `<ListaGoleadoras />`: un
          cuadro con borde alrededor de una frase pesa como si hubiera datos. */}
      {hay ? (
        <ListaGoleadoras
          goleadoras={goleadoras.slice(0, TOP)}
          temporada={temporada.nombre}
        />
      ) : (
        <p className="font-body text-[0.95rem] text-gris">
          Todavía no hay goles cargados en {temporada.nombre}.
        </p>
      )}
    </section>
  )
}
