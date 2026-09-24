'use server'

import { revalidatePath } from 'next/cache'
import { inngest, notaPublicada } from '@/lib/inngest/client'
import { chequearPublicacion, esquemaNota, firmaDe, redesAPostear } from '@/lib/nota'
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
 * exigir con `es_autor()`. Quién termina firmando puede no ser quien escribe
 * —ver `firmaDe()`— pero eso también lo decide el servidor.
 *
 * **La firma se pone al crear y no se vuelve a tocar.** Editar una nota no la
 * reasigna a quien la editó: quien corrige un error de tipeo en una nota ajena
 * no pasa a ser su autor.
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

/**
 * Lo que va a la base, ya sin los campos que decide el servidor.
 *
 * **Sin `autor_id`**, que no es un campo editable: al crear lo pone quien crea
 * (ver `firmaDe()`) y al editar no se toca. Incluirlo acá hacía que cualquier
 * corrección sobre una nota ajena se la reasignara a quien la abrió, que es la
 * forma más silenciosa de robarle la firma a alguien: no hay nada en la
 * pantalla que lo anuncie y la nota ya estaba publicada.
 */
function filaDesde(entrada: ReturnType<typeof esquemaNota.parse>) {
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
  const fila = filaDesde(parseo.data)

  const { data, error } = id
    ? await supabase.from('notas').update(fila).eq('id', id).select('id, slug').single()
    : await supabase
        .from('notas')
        .insert({ ...fila, autor_id: firmaDe(autor) })
        .select('id, slug')
        .single()

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
 * Le avisa a Inngest que hay una nota nueva para postear.
 *
 * **No se postea inline en el request** (blueprint § 6.1): un fetch a tres APIs
 * de terceros acá dejaría la publicación colgada de que las tres contesten, y
 * Vercel corta el request mucho antes de que Meta se decida. Lo que sale de acá
 * es un evento; el fan-out con reintentos e idempotencia lo hace la función
 * durable de `src/lib/inngest/funciones/nota-publicada.ts`.
 *
 * **Un fallo al emitir el evento no hace fallar la publicación.** La nota ya
 * está publicada y el sitio ya la muestra: convertir eso en un error haría que
 * Charlie apretara "publicar" otra vez sobre algo que ya salió. Las redes son
 * un efecto, no la publicación.
 *
 * Si la nota tiene el auto-posteo apagado no se emite nada: el evento
 * dispararía una función que no tendría ninguna red que intentar.
 */
async function dispararPosteo(
  id: string,
  slug: string,
  entrada: ReturnType<typeof esquemaNota.parse>,
): Promise<void> {
  if (redesAPostear(entrada).length === 0) return

  try {
    await inngest.send(notaPublicada.create({ notaId: id, slug }))
  } catch {
    // Queda el registro de que no salió en `social_posts`… que todavía no
    // existe para esta nota, justamente porque el evento no llegó. Es la
    // única pérdida silenciosa del pipeline y está acotada: se resuelve
    // volviendo a publicar, o con el botón de reintentar del panel cuando
    // exista (Step 18).
  }
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
    ...filaDesde(parseo.data),
    estado: 'publicada' as const,
    publicada_en: new Date().toISOString(),
  }

  const { data, error } = id
    ? await supabase.from('notas').update(fila).eq('id', id).select('id, slug').single()
    : await supabase
        .from('notas')
        .insert({ ...fila, autor_id: firmaDe(autor) })
        .select('id, slug')
        .single()

  if (error) {
    return {
      error: error.code === '23505' ? 'Ya existe una nota con ese slug' : 'No se pudo publicar',
    }
  }

  revalidarRutasPublicas(data.slug)

  await dispararPosteo(data.id, data.slug, parseo.data)

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
