'use client'

import { BotonBorrar } from '@/components/admin/BotonBorrar'
import { borrarNotaPorApi } from '@/lib/api/notas-cliente'

/**
 * El botón de borrar una nota, hablando con `DELETE /api/notas/<id>`.
 *
 * **Por qué hace falta este envoltorio.** `BotonBorrar` es genérico —lo usan
 * equipos, jugadoras, temporadas— y recibe la función de borrar como prop. La
 * pantalla de editar es un Server Component, así que lo que le pasaba era un
 * Server Action: un 200 tanto si la nota se borraba como si ya no estaba.
 * Desde un Server Component no se puede pasar una función de cliente, así que
 * el `fetch` tiene que vivir en un componente de cliente, y éste es.
 *
 * Borrar devuelve **200**, no 201: no nace nada. Y un id que no existe —o una
 * nota que no es tuya— devuelve **404**, que es lo que antes era un 200 con el
 * aviso adentro del cuerpo.
 */
interface Props {
  id: string
  /** Qué se está por borrar: «El título». Va adentro de la pregunta. */
  que: string
  /** Lo que se lleva puesto. Cambia según la nota esté publicada o no. */
  consecuencia?: string
}

export function BorrarNotaPorApi({ id, que, consecuencia }: Props) {
  return (
    <BotonBorrar
      que={que}
      consecuencia={consecuencia}
      borrar={async () => ({ error: (await borrarNotaPorApi(id)).error })}
      volverA="/admin"
    />
  )
}
