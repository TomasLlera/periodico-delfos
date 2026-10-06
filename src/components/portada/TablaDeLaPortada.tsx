import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { TablaCompacta } from '@/components/portada/TablaCompacta'
import type { FilaTablaConEquipo, Temporada } from '@/types'

/**
 * El bloque de la tabla de posiciones en la portada.
 *
 * **Va en la columna angosta, al lado de los análisis, como el plantel y las
 * goleadoras**, y con la versión corta de la tabla. La primera versión ocupaba
 * el ancho entero con las once columnas y se comía la pantalla antes de que
 * apareciera una nota: una tabla completa es una pantalla de consulta, no un
 * bloque de portada. Quien quiera el detalle entra a la temporada, que es a
 * donde lleva el link del encabezado.
 *
 * **Es la última fecha cargada, no un cálculo.** La tabla la carga Charlie fecha
 * por fecha y eso no es una limitación a resolver: el medio cubre a Aldosivi y
 * no a los otros partidos de la zona, así que los resultados que viven en esta
 * base no alcanzan para calcular las posiciones de los once equipos. Lo que se
 * consigue a cambio es lo que pidió Charlie: **queda guardada la tabla de cada
 * fecha**, y por eso la ficha de un partido de 2024 puede mostrar cómo estaba el
 * campeonato ese día.
 *
 * **No cuesta una consulta más.** Las filas llegan de `getEstadoDelSitio()`, que
 * ya leía la tabla entera para sacar de ahí la posición de Aldosivi que muestra
 * la barra de arriba. Antes se tiraba el resto; ahora se dibuja.
 *
 * **Sin ninguna fecha cargada no se dibuja nada**, ni el título ni un recuadro
 * avisando que falta: en la portada, un bloque vacío ocupa el lugar de una nota.
 * El recordatorio va en el panel, que es donde alguien puede hacer algo.
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
      <CabeceraBloque
        id="tabla-portada"
        titulo="Tabla"
        enlace={{ href: `/temporada/${temporada.slug}`, texto: 'Completa' }}
      />

      <TablaCompacta filas={filas} fecha={fecha} temporada={temporada.nombre} />
    </section>
  )
}
