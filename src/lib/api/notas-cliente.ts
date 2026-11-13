import { mensajeDelError } from '@/lib/api/errores'
import type { EntradaNota } from '@/lib/nota'

/**
 * Lo que el panel usa para hablar con las rutas de `/api`.
 *
 * **Existe para que el panel muestre el código que da el servidor.** Antes el
 * formulario llamaba a los Server Actions, y un Server Action responde 200
 * tanto si la nota se creó como si el slug estaba repetido: el resultado
 * viajaba adentro del cuerpo. En la pestaña Network las dos cosas eran la
 * misma respuesta, y no había nada sobre lo cual afirmar.
 *
 * Qué código espera cada una, y por qué:
 *
 * - **crear** → `201`. Nace una nota que no existía.
 * - **publicar** → `201`. Nace `/nota/<slug>`, que hasta ese momento devolvía
 *   404. Lo que se crea es la publicación, por eso es su propia colección.
 * - **editar** → `200`. No nace nada: cambia lo que ya estaba.
 * - **borrar** → `200`. Tampoco nace nada, y la respuesta lleva cuerpo.
 *
 * Las cuatro devuelven la misma forma que devolvían los Server Actions
 * —`{ id, slug }` o `{ error }`— así los componentes no se enteran de que
 * cambió el camino.
 */
export interface ResultadoApiNota {
  id?: string
  slug?: string
  error?: string
}

/** Manda el pedido y exige el código exacto que el contrato promete. */
async function pedir(
  url: string,
  metodo: string,
  cuerpo: unknown,
  esperado: number,
  siFalla: string,
): Promise<ResultadoApiNota> {
  let respuesta: Response

  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    // Si se corta la red no hay código: el fetch tira. Decirlo con sus palabras
    // evita que parezca que los datos estaban mal.
    return { error: 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.' }
  }

  const leido: unknown = await respuesta.json().catch(() => null)

  // **Se exige el código exacto y no `respuesta.ok`.** Un 200 donde el contrato
  // dice 201 significa que la ruta dejó de cumplirlo, y es justo lo que todo
  // esto vino a arreglar: conviene que se note y no que pase de largo.
  if (respuesta.status !== esperado) return { error: mensajeDelError(leido, siFalla) }

  return { id: textoDe(leido, 'id'), slug: textoDe(leido, 'slug') }
}

/** `POST /api/notas` → 201. La nota nace como borrador: esto no publica. */
export function crearNotaPorApi(entrada: EntradaNota): Promise<ResultadoApiNota> {
  return pedir('/api/notas', 'POST', entrada, 201, 'No se pudo guardar')
}

/** `PUT /api/notas/<id>` → 200. Editar no crea nada. */
export function editarNotaPorApi(entrada: EntradaNota, id: string): Promise<ResultadoApiNota> {
  return pedir(`/api/notas/${id}`, 'PUT', entrada, 200, 'No se pudo guardar')
}

/** `POST /api/publicaciones` → 201 + `Location: /nota/<slug>`. */
export function publicarNotaPorApi(
  entrada: EntradaNota,
  id: string | null,
  publicadaEn: string | null,
): Promise<ResultadoApiNota> {
  return pedir(
    '/api/publicaciones',
    'POST',
    { id, nota: entrada, publicada_en: publicadaEn },
    201,
    'No se pudo publicar',
  )
}

/** `DELETE /api/notas/<id>` → 200. */
export function borrarNotaPorApi(id: string): Promise<ResultadoApiNota> {
  return pedir(`/api/notas/${id}`, 'DELETE', undefined, 200, 'No se pudo borrar la nota.')
}

function textoDe(cuerpo: unknown, campo: string): string | undefined {
  if (cuerpo !== null && typeof cuerpo === 'object' && campo in cuerpo) {
    const valor = (cuerpo as Record<string, unknown>)[campo]
    if (typeof valor === 'string') return valor
  }

  return undefined
}
