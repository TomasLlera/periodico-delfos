import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { TablaCompacta } from '@/components/portada/TablaCompacta'
import type { FilaTablaConEquipo, Temporada } from '@/types'

/**
 * El bloque de la tabla de posiciones en la portada.
 *
 * **Va arriba de todo en la columna angosta de la derecha**, antes de las
 * goleadoras y del plantel, con la versión corta de cuatro columnas
 * (`<TablaCompacta />`).
 *
 * **Se probó a lo ancho, entre las notas y las secciones, y se volvió.** Es la
 * alternativa que se descartó y conviene tenerla escrita: con cuatro columnas
 * estiradas a 1200px los puntos quedan a media pantalla del nombre del equipo y
 * la fila se lee con el dedo; con las once columnas completas deja de ser un
 * bloque de portada y pasa a ser la pantalla de consulta que ya existe a un
 * click. El ancho de la columna angosta es lo que la mantiene legible.
 *
 * **Es la última fecha cargada, no un cálculo.** La tabla la carga Charlie fecha
 * por fecha y eso no es una limitación a resolver: el medio cubre a Aldosivi y
 * no a los otros partidos de la zona, así que los resultados que viven en esta
 * base no alcanzan para calcular las posiciones de los once equipos. La
 * consecuencia hay que tenerla escrita: **la tabla puede estar una fecha atrás
 * de lo jugado**, porque cargar el partido de Aldosivi no mueve a los otros diez
 * equipos. Por eso el rótulo dice "tras la fecha N" y no "hoy": lo que se
 * muestra es el campeonato a esa altura, y el recordatorio de que falta una
 * fecha vive en el panel (`<RecordatorioTabla />`), que es donde alguien puede
 * hacer algo.
 *
 * **No cuesta una consulta más.** Las filas llegan de `getEstadoDelSitio()`, que
 * ya leía la tabla entera para sacar de ahí la posición de Aldosivi que muestra
 * la barra de arriba. Antes se tiraba el resto; ahora se dibuja.
 *
 * **El link va a la pestaña de la tabla, no a la temporada pelada.** Un link que
 * dice "Ver tabla completa" y cae en el fixture es un link roto que devuelve
 * 200. Por eso lleva el `?ver=tabla` y no pasa por `/fixture`: esa ruta resuelve
 * la temporada activa y redirige sin parámetros, así que no puede abrir una
 * pestaña puntual sin leer la query —y leerla la volvería dinámica—. El slug no
 * se hardcodea: sale de la temporada activa que ya tiene este bloque.
 *
 * **Sin ninguna fecha cargada no se dibuja nada**, ni el título ni un recuadro
 * avisando que falta: en la portada, un bloque vacío ocupa el lugar de una nota.
 */
interface Props {
  temporada: Temporada
  filas: readonly FilaTablaConEquipo[]
  fecha: number | null
}

export function TablaDeLaPortada({ temporada, filas, fecha }: Props) {
  if (filas.length === 0) return null

  return (
    <section aria-labelledby="tabla-portada" className="mt-bloque">
      {/* "Tabla" y no "Tabla de posiciones": en la columna angosta el título
          largo se parte en dos líneas y empuja el link abajo del filete. */}
      <CabeceraBloque
        id="tabla-portada"
        titulo="Tabla"
        enlace={{
          href: `/temporada/${temporada.slug}?ver=tabla`,
          texto: 'Ver tabla completa',
        }}
      />

      <TablaCompacta filas={filas} fecha={fecha} temporada={temporada.nombre} />
    </section>
  )
}
