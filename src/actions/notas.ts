'use server'

import { revalidatePath } from 'next/cache'
import { chequearPublicacion, esquemaNota } from '@/lib/nota'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * Guardar, publicar y despublicar una nota.
 *
 * Reciben un objeto y no un `FormData`: el cuerpo es TipTap JSON, un árbol, y
 * serializarlo a campos de formulario para volver a armarlo del otro lado sería
 * trabajo inventado. Los Server Actions aceptan cualquier cosa serializable.
 *
 * **Todo se vuelve a validar acá.** El formulario ya corrió `esquemaNota` y
 * `chequearPublicacion()`, pero eso es comodidad para quien escribe: la
 * validación del cliente no es una garantía, porque el action es una ruta HTTP
 * como cualquier otra. La última palabra la tienen igual los CHECK de
 * `0005_notas.sql`.
 *
 * **La sesión decide quién escribe, no el formulario.** `autor_id` sale de
 * `getAutorDeLaSesion()` y nunca de lo que mandó el navegador; RLS lo vuelve a
 * exigir con `es_autor()`.
 */

export interface ResultadoNota {
  id?: string
  slug?: string
  error?: string
  /** Lo que le falta a la nota para poder publicarse, en palabras. */
  motivos?: string[]
}

/**
 * Las rutas que muestran notas y hay que refrescar al publicar.
 *
 * Sin esto la nota no aparece hasta que venza el ISR de 60 segundos, y Charlie
 * la ve "perdida" justo cuando acaba de publicarla.
 */
function revalidarRutasPublicas(slug: string): void {
  revalidatePath('/')
  revalidatePath('/cronicas')
  revalidatePath('/analisis')
  revalidatePath(`/nota/${slug}`)
}

/** Lo que va a la base, ya sin los campos que decide el servidor. */
function filaDesde(entrada: ReturnType<typeof esquemaNota.parse>, autorId: string) {
  return {
    titulo: entrada.titulo,
    slug: entrada.slug,
    bajada: entrada.bajada,
    cuerpo: entrada.cuerpo,
    imagen_portada: entrada.imagen_portada,
    imagen_alt: entrada.imagen_alt,
    imagen_credito: entrada.imagen_credito,
    categoria: entrada.categoria,
    temporada_id: entrada.temporada_id,
    partido_id: entrada.partido_id,
    destacada: entrada.destacada,
    auto_post: entrada.auto_post,
    redes: entrada.redes,
    autor_id: autorId,
  }
}

/**
 * Guarda sin publicar.
 *
 * Es deliberadamente más permisivo que publicar: un borrador a medio escribir
 * tiene que poder guardarse, que es el punto de un borrador. Lo único que exige
 * es lo que la base no perdona —título, bajada y el alt si hay imagen—, porque
 * un guardado que revienta contra un CHECK pierde el trabajo.
 */
export async function guardarNota(datos: unknown, id: string | null): Promise<ResultadoNota> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const parseo = esquemaNota.safeParse(datos)
  if (!parseo.success) {
    return { error: 'Faltan datos', motivos: parseo.error.issues.map((i) => i.message) }
  }

  const supabase = await createClient()
  const fila = filaDesde(parseo.data, autor.id)

  const { data, error } = id
    ? await supabase.from('notas').update(fila).eq('id', id).select('id, slug').single()
    : await supabase.from('notas').insert(fila).select('id, slug').single()

  // El caso frecuente es el slug repetido: dos notas del mismo partido con el
  // mismo título. Decirlo con el nombre del campo evita que parezca un error
  // del sistema.
  if (error) {
    return {
      error: error.code === '23505' ? 'Ya existe una nota con ese slug' : 'No se pudo guardar',
    }
  }

  return { id: data.id, slug: data.slug }
}

/**
 * Publica: guarda, sella la fecha y refresca el sitio.
 *
 * `publicada_en` lo pone el servidor y no el formulario: es la fecha que va a
 * ver el lector y la que ordena la portada, y no puede depender del reloj de la
 * máquina de quien publica.
 */
export async function publicarNota(datos: unknown, id: string | null): Promise<ResultadoNota> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const parseo = esquemaNota.safeParse(datos)
  if (!parseo.success) {
    return { error: 'Faltan datos', motivos: parseo.error.issues.map((i) => i.message) }
  }

  // El mismo chequeo que hizo el formulario antes de abrir la vista previa. Se
  // repite porque el action se puede llamar sin haber pasado por ahí.
  const chequeo = chequearPublicacion(parseo.data)
  if (!chequeo.puede) {
    return { error: 'La nota todavía no se puede publicar', motivos: chequeo.motivos }
  }

  const supabase = await createClient()
  const fila = {
    ...filaDesde(parseo.data, autor.id),
    estado: 'publicada' as const,
    publicada_en: new Date().toISOString(),
  }

  const { data, error } = id
    ? await supabase.from('notas').update(fila).eq('id', id).select('id, slug').single()
    : await supabase.from('notas').insert(fila).select('id, slug').single()

  if (error) {
    return {
      error: error.code === '23505' ? 'Ya existe una nota con ese slug' : 'No se pudo publicar',
    }
  }

  revalidarRutasPublicas(data.slug)

  // ACÁ VA EL DISPARO A INNGEST: `nota/publicada`, y la función durable hace el
  // fan-out a Facebook, Instagram y X con reintentos e idempotencia vía
  // `social_posts` (blueprint § 6.1). Todavía no está cableado y **no se postea
  // inline en el request**: un fetch a tres APIs acá dejaría la publicación
  // colgada de que las tres respondan. Las redes elegidas salen de
  // `redesAPostear()` en `src/lib/nota.ts`.

  return { id: data.id, slug: data.slug }
}

/**
 * Vuelve una nota a borrador.
 *
 * No borra `publicada_en`: si se vuelve a publicar conviene saber cuándo salió
 * la primera vez, y el sitio filtra por `estado`, no por la fecha.
 */
export async function despublicarNota(id: string): Promise<ResultadoNota> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notas')
    .update({ estado: 'borrador' as const })
    .eq('id', id)
    .select('id, slug')
    .single()

  if (error) return { error: 'No se pudo despublicar' }

  revalidarRutasPublicas(data.slug)

  return { id: data.id, slug: data.slug }
}
