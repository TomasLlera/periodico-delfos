/**
 * El copy de cada red, armado con los datos del partido.
 *
 * Acá es donde el auto-posting deja de ser genérico (blueprint 6.3). Como la
 * nota está vinculada a `partido_id`, el posteo no dice "nueva nota en el
 * sitio": dice el marcador, la fecha, quién hizo los goles y a qué hora se
 * juega. Todo eso sale de la base —regla no negociable 1— y de los mismos
 * helpers que usa `<PlanillaPartido />`, así que el copy y la planilla no
 * pueden contradecirse.
 *
 * Tres formas, según el partido y no según la categoría de la nota: una crónica
 * de un partido que todavía no se jugó tiene que anunciarlo, no dar un
 * resultado que no existe.
 *
 *     ⚽ Fecha 12 · Aldosivi 1-2 Defensa y Justicia    partido finalizado
 *     🔍 Previa Fecha 12 · Aldosivi vs Defensa…        partido programado
 *     {título}                                          sin partido
 *
 * Puro y sin I/O: no consulta la base ni le pega a ninguna API. Quien postea es
 * `lib/social/*`, desde una función de Inngest.
 */

import { etiquetaFecha, fechaHoraPartido } from '@/lib/formato'
import { ETIQUETA_ESTADO, ladosDelPartido, resumenGoles } from '@/lib/partido'
import { LARGO_MAXIMO_X, largoEnX, pesoDeTexto, recortarAPeso } from '@/lib/social/limites'
import type { NotaConRelaciones, PartidoCompleto, PartidoConEquipos, Red } from '@/types'

/** Instagram no admite links en el caption, pero sí 2200 caracteres. */
const LARGO_MAXIMO_INSTAGRAM = 2200

/**
 * Facebook no tiene un límite práctico para el `caption` de una foto.
 * El número existe para que las tres redes se traten igual, no para recortar.
 */
const LARGO_MAXIMO_FACEBOOK = 60000

/**
 * Los mismos en las tres redes, y pocos.
 *
 * Instagram admite 30, pero una tira de hashtags genéricos no acerca lectores
 * de fútbol femenino de Mar del Plata: los acerca aparecer siempre bajo los
 * mismos tres.
 */
export const HASHTAGS: readonly string[] = ['#Aldosivi', '#Tiburonas', '#FútbolFemenino']

export interface DatosDelCopy {
  nota: NotaConRelaciones
  /**
   * El partido con sus eventos, para nombrar a las goleadoras.
   *
   * `nota.partido` ya trae el marcador y los equipos, pero no los goles. Si no
   * viene, el copy se arma igual: pierde la línea de goleadoras, nada más.
   */
  partido?: PartidoCompleto | null
  /** Base pública del sitio. La barra final sobra y se ignora. */
  urlSitio: string
}

export interface CopyDeRed {
  red: Red
  texto: string
  /** Lo que mide la red. En X un link cuenta 23, no su largo real. */
  largo: number
  limite: number
  /**
   * `false` si ni sacando la bajada entera entra.
   *
   * Sólo puede pasar en X y con un título larguísimo. Quien postea tiene que
   * mirarlo: publicar un texto de más de 280 en X es un 403, no un recorte.
   */
  entra: boolean
  /**
   * `true` si el texto no es el copy entero: se cayó la línea de datos, se
   * recortó la bajada, o las dos cosas.
   */
  recortado: boolean
}

// ============================================
// Los bloques, antes de repartirlos por red
// ============================================

interface Bloques {
  encabezado: string
  /** La línea de datos duros: goleadoras, o día y cancha. */
  datos: string | null
  bajada: string
  link: string
  hashtags: string
}

/** "Fecha 12", o el nombre de la temporada cuando el partido no tiene número. */
function etiquetaCorta(partido: PartidoConEquipos): string {
  return partido.fecha_numero ? `Fecha ${partido.fecha_numero}` : partido.temporada.nombre
}

/**
 * "Aldosivi 1-2 Defensa y Justicia".
 *
 * Aldosivi primero, juegue de local o de visitante, por la misma razón que va
 * siempre a la izquierda de la planilla: es un medio de un solo club y que el
 * orden cambie según el partido obliga a releer el marcador cada vez.
 */
function marcadorDelCopy(partido: PartidoConEquipos): string | null {
  const { izquierda, derecha, golesIzquierda, golesDerecha } = ladosDelPartido(partido)
  if (golesIzquierda === null || golesDerecha === null) return null
  return `${izquierda.nombre_corto} ${golesIzquierda}-${golesDerecha} ${derecha.nombre_corto}`
}

function cruceDelCopy(partido: PartidoConEquipos): string {
  const { izquierda, derecha } = ladosDelPartido(partido)
  return `${izquierda.nombre_corto} vs ${derecha.nombre_corto}`
}

/** "⚽ Corona 23', Cortadi 61' (p)" — los goles de Aldosivi, en orden. */
function lineaDeGoles(partido: PartidoCompleto | null | undefined): string | null {
  if (!partido) return null
  const goles = resumenGoles(partido).aldosivi
  return goles.length === 0 ? null : `⚽ ${goles.join(', ')}`
}

/** "📅 sábado 15/8, 15:30 · Predio Punta Mogotes" */
function lineaDeCita(partido: PartidoConEquipos): string {
  const cuando = fechaHoraPartido(partido.fecha_hora)
  return `📅 ${[cuando, partido.cancha].filter(Boolean).join(' · ')}`
}

function armarBloques(entrada: DatosDelCopy): Bloques {
  const { nota } = entrada
  /** Sólo el partido completo trae `eventos`, que es lo que nombra las goleadoras. */
  const conEventos = entrada.partido ?? null
  const partido: PartidoConEquipos | null = conEventos ?? nota.partido
  const urlSitio = entrada.urlSitio.replace(/\/+$/, '')

  const base = {
    // Trimeada una sola vez, acá: si no, un salto de línea al final de la
    // bajada mete un blanco de más en el copy y hace que el recorte se declare
    // a sí mismo distinto del original cuando no cambió nada.
    bajada: nota.bajada.trim(),
    link: `${urlSitio}/nota/${nota.slug}`,
    hashtags: HASHTAGS.join(' '),
  }

  if (!partido) {
    // Sin partido no hay dato deportivo que mostrar: el título hace de titular.
    return { ...base, encabezado: nota.titulo, datos: null }
  }

  const marcador = partido.estado === 'finalizado' ? marcadorDelCopy(partido) : null

  if (marcador) {
    return {
      ...base,
      encabezado: `⚽ ${etiquetaCorta(partido)} · ${marcador}`,
      datos: lineaDeGoles(conEventos),
    }
  }

  if (partido.estado === 'programado') {
    return {
      ...base,
      encabezado: `🔍 Previa ${etiquetaCorta(partido)} · ${cruceDelCopy(partido)}`,
      datos: lineaDeCita(partido),
    }
  }

  // En curso, suspendido o postergado: hay partido pero no hay resultado ni
  // cita que anunciar. El título dice lo que pasó mejor que una plantilla, y la
  // línea de datos aclara en qué quedó: sin el estado, un partido suspendido se
  // lee igual que uno cualquiera.
  //
  // `finalizado` queda afuera de la etiqueta por el mismo criterio que
  // `tituloAccesible()`: llegar acá siendo final significa que el marcador no
  // está cargado, y un "Final" sin resultado al lado no dice nada.
  const estado = partido.estado === 'finalizado' ? null : ETIQUETA_ESTADO[partido.estado]
  return {
    ...base,
    encabezado: nota.titulo,
    datos: [etiquetaFecha(partido), estado].filter(Boolean).join(' · '),
  }
}

// ============================================
// Una red por vez
// ============================================

/** Encabezado y datos van juntos; los demás bloques, separados por un blanco. */
function unir(cabeza: string, cuerpo: readonly (string | null)[]): string {
  return [cabeza, ...cuerpo].filter((parte): parte is string => Boolean(parte)).join('\n\n')
}

function cabezaDe(bloques: Bloques, conDatos: boolean): string {
  return [bloques.encabezado, conDatos ? bloques.datos : null]
    .filter((parte): parte is string => Boolean(parte))
    .join('\n')
}

/**
 * Lo que queda para la bajada después de la cabeza, la cola y el blanco que las
 * separa de ella. `medir` es lo que cuenta esa red: en X el link vale 23.
 */
function presupuestoDeBajada(
  cabeza: string,
  cola: string,
  limite: number,
  medir: (texto: string) => number,
): number {
  return limite - medir(unir(cabeza, [cola])) - pesoDeTexto('\n\n')
}

function componerFacebook(bloques: Bloques): CopyDeRed {
  const texto = unir(cabezaDe(bloques, true), [
    bloques.bajada,
    `🔗 ${bloques.link}\n${bloques.hashtags}`,
  ])
  const largo = pesoDeTexto(texto)

  return {
    red: 'facebook',
    texto,
    largo,
    limite: LARGO_MAXIMO_FACEBOOK,
    // Se mide igual que en las otras dos aunque no vaya a fallar nunca: un
    // `entra` afirmado a mano es una promesa que nadie vuelve a chequear.
    entra: largo <= LARGO_MAXIMO_FACEBOOK,
    recortado: false,
  }
}

/**
 * Instagram: sin link, porque en el caption no es clickeable.
 *
 * En vez del `🔗` va el dominio pelado. No lleva a ningún lado con un toque,
 * pero es lo que alguien tipea si le interesó; un caption que termina en la
 * bajada no le da a dónde ir.
 */
function componerInstagram(bloques: Bloques): CopyDeRed {
  let dominio = bloques.link
  try {
    dominio = new URL(bloques.link).host.replace(/^www\./, '')
  } catch {
    // Un `urlSitio` mal formado no puede tumbar el copy de las otras redes.
  }

  const cabeza = cabezaDe(bloques, true)
  const cola = `Nota completa en ${dominio}\n${bloques.hashtags}`
  const completo = unir(cabeza, [bloques.bajada, cola])

  const salida = (texto: string): CopyDeRed => {
    const largo = pesoDeTexto(texto)
    return {
      red: 'instagram',
      texto,
      largo,
      limite: LARGO_MAXIMO_INSTAGRAM,
      entra: largo <= LARGO_MAXIMO_INSTAGRAM,
      recortado: texto !== completo,
    }
  }

  if (pesoDeTexto(completo) <= LARGO_MAXIMO_INSTAGRAM) return salida(completo)

  const disponible = presupuestoDeBajada(cabeza, cola, LARGO_MAXIMO_INSTAGRAM, pesoDeTexto)
  return salida(unir(cabeza, [recortarAPeso(bloques.bajada, disponible), cola]))
}

/**
 * X: 280 de peso, y el título y el link no se tocan.
 *
 * Se sacrifica en este orden: primero la línea de datos, después la bajada se
 * recorta, y por último se va entera. Las goleadoras y la cita son lindas de
 * tener; la bajada es lo que explica de qué se trata, y el link es para qué se
 * postea.
 */
function componerX(bloques: Bloques): CopyDeRed {
  const cola = `🔗 ${bloques.link}\n${bloques.hashtags}`
  const conDatos = cabezaDe(bloques, true)
  const sinDatos = cabezaDe(bloques, false)

  const armar = (cabeza: string, bajada: string) => unir(cabeza, [bajada, cola])
  const completo = armar(conDatos, bloques.bajada)

  const salida = (texto: string): CopyDeRed => {
    const largo = largoEnX(texto)
    return {
      red: 'x',
      texto,
      largo,
      limite: LARGO_MAXIMO_X,
      // Medido, no afirmado: sólo el último escalón puede no entrar, y es el
      // único caso en el que quien postea tiene que mirar antes de mandar.
      entra: largo <= LARGO_MAXIMO_X,
      // Cualquier cosa que no sea el copy entero es un sacrificio, sea la línea
      // de datos o la bajada. Comparar contra `completo` lo deja exacto sin
      // tener que llevar la cuenta escalón por escalón.
      recortado: texto !== completo,
    }
  }

  // 1. Todo entero.
  if (largoEnX(completo) <= LARGO_MAXIMO_X) return salida(completo)

  // 2. Se cae la línea de datos, entera y antes de tocar la bajada. Las
  //    goleadoras y la cita son lindas de tener y además están en la nota; la
  //    bajada es lo único que explica de qué se trata.
  const sinLaLinea = armar(sinDatos, bloques.bajada)
  if (largoEnX(sinLaLinea) <= LARGO_MAXIMO_X) return salida(sinLaLinea)

  // 3. Recién ahora se recorta la bajada, por palabra.
  const disponible = presupuestoDeBajada(sinDatos, cola, LARGO_MAXIMO_X, largoEnX)
  const recortada = recortarAPeso(bloques.bajada, disponible)
  if (recortada !== '') return salida(armar(sinDatos, recortada))

  // 4. Ni una palabra de bajada entró. Queda el encabezado y el link, que es el
  //    mínimo con el que el posteo sigue sirviendo para algo. El título y el
  //    link no se tocan nunca: si esto tampoco entra, sale `entra: false`.
  return salida(armar(sinDatos, ''))
}

// ============================================
// La puerta de entrada
// ============================================

export function componerCopy(red: Red, datos: DatosDelCopy): CopyDeRed {
  const bloques = armarBloques(datos)

  switch (red) {
    case 'facebook':
      return componerFacebook(bloques)
    case 'instagram':
      return componerInstagram(bloques)
    case 'x':
      return componerX(bloques)
  }
}

/** El copy de las tres redes de una sola pasada. */
export function componerTodos(datos: DatosDelCopy): Record<Red, CopyDeRed> {
  return {
    facebook: componerCopy('facebook', datos),
    instagram: componerCopy('instagram', datos),
    x: componerCopy('x', datos),
  }
}
