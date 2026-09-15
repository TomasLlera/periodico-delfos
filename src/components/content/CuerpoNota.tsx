/**
 * El cuerpo de la nota, con sus planillas ya resueltas.
 *
 * `<CuerpoTipTap />` no consulta la base: recibe un mapa de partidos indexados
 * por id. Armar ese mapa es trabajo de la página, que lee los `partidoId` con
 * `partidoIdsDelCuerpo()` y los pide todos en una sola consulta. Este
 * componente es la costura entre las dos cosas y no agrega nada más.
 *
 * Si la nota tiene `partido_id` propio, su planilla va **abajo del cuerpo** y
 * no adentro (blueprint 7.3): el cuerpo es la crónica y la planilla es el dato,
 * y meterla en el medio del texto la deja donde el editor haya puesto el nodo,
 * que puede no ser ningún lado.
 */

import { CuerpoTipTap, type MapaDePartidos } from '@/lib/tiptap/render'

interface Props {
  /** `notas.cuerpo` tal como sale de la base. Sin tipar: no es confiable. */
  cuerpo: unknown
  partidos: MapaDePartidos
}

export function CuerpoNota({ cuerpo, partidos }: Props) {
  return <CuerpoTipTap cuerpo={cuerpo} partidos={partidos} nivelBase={2} />
}
