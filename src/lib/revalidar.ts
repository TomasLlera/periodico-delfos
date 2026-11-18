/**
 * Qué rutas públicas hay que refrescar cuando cambia un dato del panel.
 *
 * Vive acá y no adentro de cada action porque el mapa es el mismo para los
 * seis y equivocarlo no se ve: la pantalla del panel muestra el dato nuevo
 * —es `force-dynamic`— y el sitio público sigue sirviendo el viejo hasta que
 * vence el ISR de 60 segundos. El síntoma es "lo cargué y no aparece", que es
 * exactamente lo que hace que alguien cargue el dato de nuevo.
 *
 * `revalidatePath(ruta, 'page')` no alcanza para las rutas con parámetro: hay
 * que pasarle el `'page'` con el patrón —`/partido/[slug]`— para voltear todas
 * las instancias de una vez, porque el nombre corto de un equipo aparece en
 * los cincuenta partidos de la temporada y no sólo en el que se está tocando.
 */

import { revalidatePath } from 'next/cache'

/** La portada y los listados donde aparece cualquier dato deportivo. */
function revalidarPortada(): void {
  revalidatePath('/')
  revalidatePath('/fixture')
  // `/plantel` entro a esta lista cuando dejo de ser dinamica: hasta entonces se
  // rearmaba en cada visita y no habia nada que invalidar. Las tres muestran lo
  // mismo —la temporada activa— asi que caen juntas o se contradicen.
  revalidatePath('/plantel')
}

/**
 * Un equipo cambió: el escudo y el nombre corto aparecen en toda página que
 * muestre un partido, así que caen las cinco rutas deportivas enteras.
 */
export function revalidarEquipos(): void {
  revalidarPortada()
  revalidatePath('/partido/[slug]', 'page')
  revalidatePath('/temporada/[slug]', 'page')
  revalidatePath('/plantel/[temporadaSlug]', 'page')
}

/** Una temporada cambió: cuál está activa decide qué muestra la portada. */
export function revalidarTemporadas(): void {
  revalidarPortada()
  revalidatePath('/temporada/[slug]', 'page')
  revalidatePath('/plantel/[temporadaSlug]', 'page')
  // El índice de dorsales es la lista de campeonatos: una temporada nueva
  // aparece ahí antes que en ningún otro lado.
  revalidatePath('/dorsales')
  revalidatePath('/dorsales/[temporadaSlug]', 'page')
}

/** Una jugadora cambió: su ficha, el plantel y las goleadoras de la portada. */
export function revalidarJugadoras(): void {
  revalidarPortada()
  revalidatePath('/jugadora/[slug]', 'page')
  revalidatePath('/plantel/[temporadaSlug]', 'page')
  // La tabla de dorsales la nombra y linkea a su ficha: un apellido corregido
  // o un slug nuevo la dejan desactualizada igual que al plantel.
  revalidatePath('/dorsales/[temporadaSlug]', 'page')
}

/**
 * Un partido cambió.
 *
 * El slug entra como parámetro cuando se conoce —para voltear también la nota
 * que lo embebe— pero las rutas con patrón caen igual: el fixture de la
 * temporada y la barra de estado de la portada leen el partido aunque no sea
 * el que se está editando.
 */
export function revalidarPartidos(slug?: string): void {
  revalidarPortada()
  revalidatePath('/partido/[slug]', 'page')
  revalidatePath('/temporada/[slug]', 'page')
  // La formación de un partido es de donde sale el dorsal desde la `0020`, y
  // `guardarFormacion()` pasa por acá: sin esta línea, cargar la planilla de la
  // fecha 6 no cambia nada en `/dorsales` hasta que vence el ISR.
  revalidatePath('/dorsales/[temporadaSlug]', 'page')
  if (slug) revalidatePath(`/partido/${slug}`)
}

/** La tabla de posiciones: la pestaña de la temporada y la barra de la portada. */
export function revalidarTabla(): void {
  revalidarPortada()
  revalidatePath('/temporada/[slug]', 'page')
}
