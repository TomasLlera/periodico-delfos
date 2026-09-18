import { partidoCompleto } from '@/app/demo/planilla/datos-demo'
import { fixtureDemo } from '@/app/demo/temporada/datos-demo'
import type { PartidoCompleto } from '@/types'

/**
 * Un partido del fixture demo, con planilla.
 *
 * **El banco de pruebas le presta a cada fecha los eventos de la única planilla
 * demo que hay.** Los equipos, la fecha, la cancha y el marcador son los del
 * chip que se apretó —salen del fixture real del sitio viejo—, pero la línea de
 * tiempo es siempre la misma y **no se corresponde con ese marcador**. Está
 * dicho en la página, y es a propósito: lo que se prueba acá es la ventana, no
 * los datos. Las incidencias por fecha no se pueden inventar (regla no
 * negociable 1) y el sitio viejo no las publica con minuto —la mitad de los
 * goles de las crónicas no lo traen, que es uno de los hallazgos de la
 * migración—.
 */
export function partidoDeLaFecha(slug: string): PartidoCompleto | null {
  const delFixture = fixtureDemo.find((partido) => partido.slug === slug)
  if (!delFixture) return null

  return {
    ...delFixture,
    eventos: partidoCompleto.eventos,
    formaciones: partidoCompleto.formaciones,
  }
}
