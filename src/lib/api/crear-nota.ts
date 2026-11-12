import { mensajeDelError } from '@/lib/api/errores'
import type { EntradaNota } from '@/lib/nota'

/**
 * Crear una nota desde el panel, por `POST /api/notas`.
 *
 * **Existe para que crear devuelva 201 y no 200.** Antes el formulario llamaba
 * al Server Action `guardarNota()`, y un Server Action responde 200 tanto si
 * la nota se creó como si el slug estaba repetido: el resultado viajaba adentro
 * del cuerpo. Desde la pestaña Network las dos cosas eran la misma respuesta.
 * Ahora el código lo da el servidor —201 creada, 409 slug repetido, 400 datos
 * inválidos, 401 sin sesión, 403 sin permiso, 503 base caída— y se puede
 * afirmar sobre él.
 *
 * Vive en su propio archivo y no adentro de `FormularioNota.tsx` para no
 * engordar un componente que ya es largo (regla 1 de organización).
 *
 * **Devuelve la misma forma que `guardarNota()`** —`{ id }` o `{ error }`— a
 * propósito: el formulario trata las dos respuestas igual y el camino de
 * edición no se entera de nada.
 */
export interface ResultadoCreacion {
  id?: string
  error?: string
}

export async function crearNotaPorApi(entrada: EntradaNota): Promise<ResultadoCreacion> {
  let respuesta: Response

  try {
    respuesta = await fetch('/api/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entrada),
    })
  } catch {
    // Si se corta la red no hay código de estado: el fetch tira. Decirlo con
    // sus palabras evita que parezca que los datos estaban mal.
    return { error: 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.' }
  }

  const cuerpo: unknown = await respuesta.json().catch(() => null)

  // **Se exige 201 y no `respuesta.ok`.** Un 200 acá significaría que la ruta
  // dejó de contestar lo que dice su contrato, y es justo lo que este cambio
  // vino a arreglar: conviene que se note y no que pase de largo.
  if (respuesta.status !== 201) {
    return { error: mensajeDelError(cuerpo, 'No se pudo guardar') }
  }

  return { id: idDe(cuerpo) }
}

function idDe(cuerpo: unknown): string | undefined {
  if (cuerpo !== null && typeof cuerpo === 'object' && 'id' in cuerpo) {
    const id = (cuerpo as { id?: unknown }).id
    if (typeof id === 'string') return id
  }

  return undefined
}
