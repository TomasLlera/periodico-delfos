import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { TablaPosiciones } from '@/components/temporada/TablaPosiciones'
import type { FilaTablaConEquipo, Temporada } from '@/types'

/**
 * La tabla de posiciones en la portada.
 *
 * **Es la última fecha cargada, no un cálculo.** La tabla la carga Charlie fecha
 * por fecha y eso no es una limitación a resolver: el medio cubre a Aldosivi y
 * no a los otros partidos de la zona, así que los resultados que viven en esta
 * base no alcanzan para calcular las posiciones de los once equipos. Lo que sí
 * se consigue a cambio es lo que pidió Charlie: **queda guardada la tabla de
 * cada fecha**, y por eso la ficha de un partido de 2024 puede mostrar cómo
 * estaba el campeonato ese día.
 *
 * **No cuesta una consulta más.** Las filas llegan de `getEstadoDelSitio()`, que
 * ya leía la tabla entera para sacar de ahí la posición de Aldosivi que muestra
 * la barra de arriba. Antes se tiraba el resto; ahora se dibuja.
 *
 * **Sin ninguna fecha cargada no se dibuja nada**, ni el título ni un recuadro
 * avisando que falta: en la portada, un bloque vacío ocupa el lugar de una nota.
 * El recordatorio de que falta cargar una fecha va en el panel, que es donde
 * alguien puede hacer algo al respecto.
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
        titulo="Tabla de posiciones"
        enlace={{ href: `/temporada/${temporada.slug}`, texto: 'La temporada completa' }}
      />

      {/* La misma tabla que la página de la temporada, con sus mismos
          encabezados y su scroll horizontal en celular: una versión reducida
          para la portada serían dos tablas que mantener y dos lugares donde
          corregir el día que cambie una columna. */}
      <TablaPosiciones filas={filas} fecha={fecha} temporada={temporada.nombre} />
    </section>
  )
}
