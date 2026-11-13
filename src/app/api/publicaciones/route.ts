import { publicarNota, type ResultadoNota } from '@/actions/notas'
import { ERRORES, mapearErrorSupabase, respuestaDeError } from '@/lib/api/errores'
import { errorDeResultado } from '@/lib/api/resultado-nota'

/**
 * Publicar una nota.
 *
 * **Por qué 201 y no 200, que es la decisión a defender.** Publicar no es
 * editar: antes de publicarla, `/nota/<slug>` devolvía 404 y después devuelve
 * 200. La petición hace existir un recurso público que no existía, y eso es
 * exactamente lo que significa 201 Created. Por eso la respuesta lleva además
 * `Location` apuntando a la nota publicada, que es lo que el 201 pide.
 *
 * Modelado como colección propia —`/api/publicaciones`— y no como un PATCH
 * sobre la nota por la misma razón: lo que se crea es la publicación. Guardar
 * el texto de una nota que ya existe sigue siendo una edición y sigue
 * devolviendo 200 por el Server Action, porque ahí no nace nada.
 *
 * **La lógica no se duplica**: la ruta llama al mismo `publicarNota()` que usa
 * el panel, que es el que valida, sella la fecha, revalida las rutas públicas y
 * decide si corresponde el auto-posteo. Lo único que agrega esta ruta es la
 * traducción de su resultado a un código HTTP, posible gracias al `codigo` que
 * ese action devuelve.
 *
 * **Ojo con el auto-posteo**: publicar con fecha de hoy dispara el fan-out a
 * Facebook, Instagram y X. No es un efecto de esta ruta —lo decide
 * `publicarNota()` igual que siempre— pero conviene tenerlo presente antes de
 * usarla para probar: con una fecha vieja (nota de archivo) no postea.
 */

interface Pedido {
  id: string | null
  nota: unknown
  publicada_en: string | null
}

function leer(recibido: unknown): Pedido {
  const cuerpo = recibido !== null && typeof recibido === 'object' ? recibido : {}
  const campo = (nombre: string): unknown => (cuerpo as Record<string, unknown>)[nombre]

  const id = campo('id')
  const fecha = campo('publicada_en')

  return {
    id: typeof id === 'string' && id.length > 0 ? id : null,
    // La nota puede venir anidada o ser el cuerpo entero: lo segundo es lo que
    // hace que un pedido de Postman se pueda escribir sin envoltorio.
    nota: campo('nota') ?? cuerpo,
    publicada_en: typeof fecha === 'string' && fecha.length > 0 ? fecha : null,
  }
}

export async function POST(request: Request): Promise<Response> {
  let recibido: unknown

  try {
    recibido = await request.json()
  } catch {
    return respuestaDeError(ERRORES.datosInvalidos('El cuerpo tiene que ser un JSON válido.'))
  }

  const pedido = leer(recibido)

  let resultado: ResultadoNota

  try {
    resultado = await publicarNota(pedido.nota, pedido.id, pedido.publicada_en)
  } catch (falla) {
    // `publicarNota()` devuelve el error en el resultado casi siempre, pero
    // resolver quién llama toca la base y eso puede tirar. Sin esto sería 500.
    const error = mapearErrorSupabase(falla, { haySesion: true })
    return respuestaDeError(error, error.estado === 503 ? { 'Retry-After': '30' } : undefined)
  }

  if (resultado.codigo) {
    const error = errorDeResultado(resultado)
    return respuestaDeError(error, error.estado === 503 ? { 'Retry-After': '30' } : undefined)
  }

  // Sin `codigo` y sin `slug` no hay nada que publicar ni nada que informar:
  // no debería pasar, y si pasa es un defecto y no una respuesta de diseño.
  if (!resultado.slug) return respuestaDeError(ERRORES.interno())

  return Response.json(
    { id: resultado.id, slug: resultado.slug },
    {
      status: 201,
      // Lo que el 201 pide: dónde quedó lo que se creó.
      headers: { Location: `/nota/${resultado.slug}` },
    },
  )
}
