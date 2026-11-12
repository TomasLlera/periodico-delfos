import { ERRORES, mapearErrorSupabase, respuestaDeError } from '@/lib/api/errores'
import { getNotaPorSlug } from '@/lib/supabase/queries/notas'

/**
 * Una nota publicada, por su slug.
 *
 * **El 404 es el caso interesante y es el que la materia mira.** Un slug que no
 * existe y una nota en borrador devuelven lo mismo —404, "no encontramos una
 * nota publicada con ese slug"— y no son el mismo hecho: en un caso no hay
 * fila, en el otro la hay pero no es pública. Contestar distinto diría desde
 * afuera qué borradores se están escribiendo, que es exactamente lo que RLS
 * evita del lado de la base. `getNotaPorSlug()` ya filtra por
 * `estado = 'publicada'`, así que las dos situaciones llegan acá como `null`.
 *
 * **Un 404 no es un error del servidor y no se registra en el log.** Pedir algo
 * que no existe es un uso normal de una API.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params

  try {
    const nota = await getNotaPorSlug(slug)

    if (!nota) {
      return respuestaDeError(
        ERRORES.noEncontrada('No encontramos una nota publicada con ese slug.'),
      )
    }

    return Response.json(nota, { status: 200 })
  } catch (falla) {
    // Sin sesión: lo que esta ruta lee es público, así que un rechazo de RLS
    // acá significa "no estás", no "no te alcanza".
    const error = mapearErrorSupabase(falla, { haySesion: false })
    return respuestaDeError(error, error.estado === 503 ? { 'Retry-After': '30' } : undefined)
  }
}
