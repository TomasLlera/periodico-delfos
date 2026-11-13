'use server'

import { revalidatePath } from 'next/cache'
import { esErrorDeRed } from '@/lib/api/errores'
import { inngest, notaPublicada } from '@/lib/inngest/client'
import {
  chequearFechaDeArchivo,
  chequearProgramacion,
  chequearPublicacion,
  esDeArchivo,
  esquemaNota,
  filaDesde,
  firmaDe,
  mismaFecha,
  redesAPostear,
} from '@/lib/nota'
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

/**
 * Por qué falló, en una palabra que puede leer el código.
 *
 * **Existe para que `POST /api/publicaciones` pueda elegir el código HTTP.** El
 * `error` de al lado es una frase para mostrarle a quien escribe, y adivinar el
 * estado HTTP comparando strings es exactamente la clase de atadura que se
 * rompe el día que alguien corrige una tilde. Esto no cambia nada para la
 * interfaz, que sigue mostrando `error` y `motivos` y nunca mira `codigo`.
 */
export type MotivoNota =
  | 'sin_sesion'
  | 'datos_invalidos'
  | 'no_publicable'
  | 'fecha_invalida'
  | 'slug_duplicado'
  | 'no_encontrada'
  | 'no_disponible'
  | 'falla'

/**
 * De un error de Postgres al motivo que le corresponde.
 *
 * **Está acá y no en `lib/api/` para no armar un ciclo**: aquel módulo importa
 * los tipos de éste. Y existe porque los tres caminos de escritura —guardar,
 * publicar, borrar— fallan igual y tienen que contestar igual.
 *
 * **El `23514` es el que costó encontrar.** Es un CHECK de la base violado:
 * editar una nota publicada mandando `publicada_en` en null choca contra
 * `publicada_tiene_fecha`. Caía en `falla` y salía **500**, que es justo lo que
 * la regla prohíbe: el pedido traía un dato que no sirve, y eso es un 400.
 */
function motivoDeError(error: { code?: string | null }): MotivoNota {
  if (error.code === '23505') return 'slug_duplicado'
  // `PGRST116` es "la consulta no devolvió ninguna fila": ese id no existe, o
  // RLS no deja verlo.
  if (error.code === 'PGRST116') return 'no_encontrada'
  // CHECK violado y fechas mal formadas: el dato vino mal.
  if (error.code === '23514' || error.code === '22007' || error.code === '22008') {
    return 'datos_invalidos'
  }
  // RLS rechazó con sesión puesta: la fila existe y no es tuya, que se cuenta
  // como no encontrada para no delatar de quién es.
  if (error.code === '42501') return 'no_encontrada'
  if (esErrorDeRed(error)) return 'no_disponible'

  return 'falla'
}

/** Qué decirle a quien escribe, según el motivo. */
const MENSAJE_POR_MOTIVO: Record<MotivoNota, string> = {
  sin_sesion: 'Se cerró la sesión. Entrá de nuevo.',
  datos_invalidos: 'Alguno de los datos no cumple una regla de la base.',
  no_publicable: 'La nota todavía no se puede publicar',
  fecha_invalida: 'Esa fecha no se puede usar.',
  slug_duplicado: 'Ya existe una nota con ese slug',
  no_encontrada: 'Esa nota no existe, o no es tuya.',
  no_disponible: 'El servicio no está disponible en este momento. Probá de nuevo en un rato.',
  falla: 'No se pudo guardar',
}

function fallaDe(error: { code?: string | null }, siEsFalla: string): ResultadoNota {
  const codigo = motivoDeError(error)

  return { error: codigo === 'falla' ? siEsFalla : MENSAJE_POR_MOTIVO[codigo], codigo }
}

export interface ResultadoNota {
  id?: string
  slug?: string
  error?: string
  /** Lo que le falta a la nota para poder publicarse, en palabras. */
  motivos?: string[]
  /** Para la ruta de API. La interfaz lo ignora. */
  codigo?: MotivoNota
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
 * Guarda sin publicar.
 *
 * Es deliberadamente más permisivo que publicar: un borrador a medio escribir
 * tiene que poder guardarse, que es el punto de un borrador. Lo único que exige
 * es lo que la base no perdona —título, bajada y el alt si hay imagen—, porque
 * un guardado que revienta contra un CHECK pierde el trabajo.
 */
export async function guardarNota(datos: unknown, id: string | null): Promise<ResultadoNota> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.', codigo: 'sin_sesion' }

  const parseo = esquemaNota.safeParse(datos)
  if (!parseo.success) {
    return {
      error: 'Faltan datos',
      motivos: parseo.error.issues.map((i) => i.message),
      codigo: 'datos_invalidos',
    }
  }

  const supabase = await createClient()

  // **La fecha va sólo si cambió**, y por eso se compara contra la guardada en
  // vez de mandarla siempre. Mandarla igual funcionaria —seria el mismo valor—
  // pero deja la puerta abierta a que un formulario mal prellenado la pise, que
  // es exactamente el bug que esto arregla.
  const fecha = id ? await fechaGuardada(supabase, id) : null
  const cambioLaFecha = !mismaFecha(parseo.data.publicada_en, fecha)

  const fila = {
    ...filaDesde(parseo.data),
    ...(cambioLaFecha ? { publicada_en: parseo.data.publicada_en } : {}),
  }

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
  // El caso frecuente es el slug repetido: dos notas del mismo partido con el
  // mismo título. Decirlo con el nombre del campo evita que parezca un error
  // del sistema.
  if (error) return fallaDe(error, 'No se pudo guardar')

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
 * La fecha que la nota ya tiene guardada, o `null`.
 *
 * Una consulta de una columna para no pisar lo que no cambió. Es barata y es
 * la unica forma de saber, del lado del servidor, si lo que llega del
 * formulario es una fecha nueva o la misma de siempre.
 */
async function fechaGuardada(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
): Promise<string | null> {
  const { data } = await supabase.from('notas').select('publicada_en').eq('id', id).maybeSingle()
  return (data as { publicada_en: string | null } | null)?.publicada_en ?? null
}

/**
 * Publica: guarda, sella la fecha y refresca el sitio.
 *
 * `publicada_en` lo pone el servidor y no el formulario: es la fecha que va a
 * ver el lector y la que ordena la portada, y no puede depender del reloj de la
 * máquina de quien publica.
 *
 * **Salvo que se la pidan explícitamente, y ése es el archivo.** Aldosivi
 * femenino compite en AFA desde hace años y hay decenas de fichas viejas para
 * cargar: sin poder fecharlas entonces, todas saldrían con la fecha de hoy y la
 * portada mostraría un partido de 2023 como la noticia del día. La fecha que
 * llega se vuelve a validar acá —no puede ser futura ni anterior al 2000— porque
 * esto es una ruta HTTP.
 */
export async function publicarNota(
  datos: unknown,
  id: string | null,
  publicadaEn: string | null = null,
): Promise<ResultadoNota> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.', codigo: 'sin_sesion' }

  const parseo = esquemaNota.safeParse(datos)
  if (!parseo.success) {
    return {
      error: 'Faltan datos',
      motivos: parseo.error.issues.map((i) => i.message),
      codigo: 'datos_invalidos',
    }
  }

  // El mismo chequeo que hizo el formulario antes de abrir la vista previa. Se
  // repite porque el action se puede llamar sin haber pasado por ahí.
  const chequeo = chequearPublicacion(parseo.data)
  if (!chequeo.puede) {
    return {
      error: 'La nota todavía no se puede publicar',
      motivos: chequeo.motivos,
      codigo: 'no_publicable',
    }
  }

  const supabase = await createClient()

  // **QUIEN GANA, EN ORDEN.** Era una sola linea —`new Date()`— y ahi estaba el
  // bug: editar una nota de mayo en octubre y apretar Publicar la refechaba a
  // octubre, porque el servidor volvia a sellarla cada vez.
  //
  // 1. Lo que eligio quien escribe en el formulario.
  // 2. Si no eligio nada, la fecha que la nota YA TENIA. Publicar de nuevo algo
  //    publicado no es volver a publicarlo.
  // 3. Y recien si no hay ninguna de las dos, ahora.
  const guardada = id ? await fechaGuardada(supabase, id) : null
  const elegida = parseo.data.publicada_en ?? publicadaEn
  const sello = elegida ?? guardada ?? new Date().toISOString()

  // Se valida del lado del servidor aunque el formulario ya lo haya hecho: esto
  // es una ruta HTTP y se puede llamar sin pasar por la pantalla.
  if (elegida !== null) {
    const chequeo = chequearFechaDeArchivo(elegida)
    if (!chequeo.puede) {
      return { error: chequeo.motivo ?? 'Esa fecha no se puede usar.', codigo: 'fecha_invalida' }
    }
  }

  const fila = {
    ...filaDesde(parseo.data),
    estado: 'publicada' as const,
    publicada_en: new Date(sello).toISOString(),
  }

  const { data, error } = id
    ? await supabase.from('notas').update(fila).eq('id', id).select('id, slug').single()
    : await supabase
        .from('notas')
        .insert({ ...fila, autor_id: firmaDe(autor) })
        .select('id, slug')
        .single()

  // La base sin responder no es "no se pudo publicar": es "ahora no se puede",
  // y la ruta lo traduce a 503 y no a 500.
  if (error) return fallaDe(error, 'No se pudo publicar')

  revalidarRutasPublicas(data.slug)

  // **Una nota de archivo no se postea a las redes.** Es lo más importante de
  // todo esto: subir treinta fichas viejas dispararía treinta posteos a
  // Instagram y X anunciando partidos de hace tres años como si fueran de hoy,
  // y eso no se puede deshacer. El auto-posteo existe para lo que acaba de
  // pasar, no para lo que se está archivando.
  // **Decide la fecha final, no como se llego a ella.** Una nota fechada hace
  // tres anios no se anuncia en las redes aunque se publique hoy; una fechada
  // hace diez minutos si.
  if (!esDeArchivo(sello)) await dispararPosteo(data.id, data.slug, parseo.data)

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

/**
 * Borra una nota, de verdad y para siempre.
 *
 * **Faltaba, y la falta se notó enseguida**: una nota de prueba cargada para
 * ver cómo quedaba el editor no tenía forma de salir del panel. Quedaba ahí
 * arriba de todo, en el grupo de borradores, para siempre.
 *
 * **El `delete` devuelve el slug de lo que borró**, y eso es lo que tiene de
 * delicado: hace falta para revalidar `/nota/<slug>`, y después del borrado ya
 * no hay fila donde ir a buscarlo. Sin esa revalidación, una nota publicada y
 * borrada sigue sirviéndose desde el cache de ISR hasta sesenta segundos más
 * tarde, y el que la borró la ve viva en el sitio.
 *
 * **Quién puede.** No hay ningún `if` de rol acá y es a propósito: lo decide
 * `escritura_propias` de la 0014, que es la misma política que gobierna el
 * editar. Quien puede guardar una nota puede borrarla; un redactor no toca las
 * de los demás. La pantalla ya lo filtra antes —`/admin/notas/[id]` hace
 * `notFound()` con la nota de otro— pero esto es una ruta HTTP y la política es
 * la que lo sostiene.
 *
 * **Lo que se va con ella y lo que no.** `social_posts` cae por `on delete
 * cascade` (0007), así que el registro de lo que salió a las redes se pierde
 * junto con la nota; el posteo en Facebook o en Instagram, en cambio, **sigue
 * publicado allá** y con el link roto. Las imágenes quedan en el bucket: son
 * compartidas —la misma foto puede ilustrar dos notas— y borrarlas acá dejaría
 * un hueco en la otra. Se limpian a mano desde Storage.
 */
export async function borrarNota(id: string): Promise<ResultadoNota> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.', codigo: 'sin_sesion' }

  const supabase = await createClient()

  // **El `select()` sobre el `delete()` no es decoración.** Devuelve las filas
  // que de verdad se borraron, y es la única forma de notar que RLS no dejó:
  // una política que rechaza no tira error, devuelve cero filas. Sin esto, el
  // botón decía "borrada", el listado se refrescaba y la nota seguía ahí.
  const { data, error } = await supabase.from('notas').delete().eq('id', id).select('slug')

  if (error) return fallaDe(error, 'No se pudo borrar la nota.')

  const borrada = (data ?? [])[0]
  if (!borrada) {
    return { error: 'No se borró: la nota ya no existe, o no es tuya.', codigo: 'no_encontrada' }
  }

  revalidarRutasPublicas(borrada.slug)

  return {}
}

/**
 * Deja la nota lista para que salga sola a la hora que se le diga.
 *
 * **Exige lo mismo que publicar, no menos.** Pasa por `chequearPublicacion()`
 * igual que `publicarNota()`: una nota que se programa es una que se va a
 * publicar sin que nadie la mire de nuevo, así que lo que no se permite
 * publicar a mano tampoco se puede dejar agendado. Si no, el error aparece
 * dentro del cron, de madrugada y sin nadie para arreglarlo.
 *
 * **No dispara el posteo a redes.** Lo hace el cron cuando la publica de
 * verdad, con el mismo evento que la publicación manual. Emitirlo acá la
 * postearía en el momento de programarla, con un link que todavía da 404.
 *
 * **No revalida nada**: una programada no sale en ninguna ruta pública. El
 * sitio filtra por `estado = 'publicada'`.
 */
export async function programarNota(
  datos: unknown,
  id: string | null,
  publicarEn: string | null,
): Promise<ResultadoNota> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const parseo = esquemaNota.safeParse(datos)
  if (!parseo.success) {
    return { error: 'Faltan datos', motivos: parseo.error.issues.map((i) => i.message) }
  }

  const chequeo = chequearPublicacion(parseo.data)
  if (!chequeo.puede) {
    return { error: 'La nota todavía no se puede programar', motivos: chequeo.motivos }
  }

  const cuando = chequearProgramacion(publicarEn)
  if (!cuando.puede) {
    return { error: 'No se puede programar para esa hora', motivos: [cuando.motivo ?? ''] }
  }

  const supabase = await createClient()
  const fila = {
    ...filaDesde(parseo.data),
    estado: 'programada' as const,
    publicar_en: publicarEn,
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
      error: error.code === '23505' ? 'Ya existe una nota con ese slug' : 'No se pudo programar',
    }
  }

  return { id: data.id, slug: data.slug }
}
