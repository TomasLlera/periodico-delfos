/**
 * La bajada, que es obligatoria y escrita a mano.
 *
 * `notas.bajada` tiene un `NOT NULL` y además un `check (length(trim(bajada)) >
 * 0)`, y el comentario de la migración dice por qué: "WordPress ya demostró que
 * un extracto vacío se llena con basura truncada". El extracto automático de
 * WordPress son las primeras 55 palabras del cuerpo cortadas donde caiga —
 * *"…una temporada que quedará en la historia. No"*— y eso es lo que hoy se
 * publica como resumen en la portada y en las tarjetas de las redes.
 *
 * Este módulo **no escribe bajadas**. Decide si la que hay es de verdad o es
 * basura; si es basura, devuelve vacío y el script lista el slug para que se
 * escriba a mano. Inventar un resumen a partir del cuerpo sería repetir el
 * problema con otra herramienta.
 */

import { normalizarEspacios, sinDiacriticos, textoPlano } from '@/lib/migracion/texto'

export type MotivoSinBajada =
  | 'vacia'
  | 'truncada'
  | 'con-puntos-suspensivos'
  | 'copiada-del-cuerpo'

export interface ResultadoBajada {
  /** La bajada, o `''` si la que había no servía. */
  bajada: string
  /** `null` cuando la bajada sirve. */
  motivo: MotivoSinBajada | null
}

/** Cuánto se compara contra el cuerpo para detectar el extracto automático. */
const LARGO_DE_COMPARACION = 60

/** Los cierres válidos de una bajada escrita a mano. */
const TERMINA_BIEN = /[.!?»”"')\]]$/u

/** La marca de continuación que WordPress agrega al recortar. */
const CONTINUACION = /\[\s*(?:…|\.\.\.|&hellip;)\s*\]|…\s*$|\.\.\.\s*$/u

/**
 * Deja el texto en la forma mínima para compararlo contra el cuerpo.
 *
 * Se saca **todo** el blanco, no se colapsa: el extracto automático pega el
 * final de un bloque con el principio del siguiente —"FICHA DEL
 * PARTIDOPrimera B 2026"— y el cuerpo, leído con las etiquetas puestas, los
 * separa. Comparando con espacios, la copia más obvia que hay en el sitio no se
 * detecta como copia.
 */
function comparable(texto: string): string {
  return sinDiacriticos(normalizarEspacios(texto)).toLowerCase().replace(/\s+/g, '')
}

/**
 * Decide si el extracto de WordPress se puede usar como bajada.
 *
 * Cuatro señales, en orden de qué tan concluyentes son. Ninguna es infalible
 * por separado y todas fallan hacia el mismo lado: ante la duda la bajada se
 * marca como pendiente y una persona la mira. Perder una bajada buena cuesta un
 * renglón escrito de más; publicar una mala cuesta la portada.
 *
 * @param extractoHtml `excerpt.rendered` tal como viene de la REST API.
 * @param cuerpoTexto El cuerpo de la nota en texto plano, para detectar la copia.
 */
export function bajadaDeExtracto(extractoHtml: string, cuerpoTexto: string): ResultadoBajada {
  const extracto = textoPlano(extractoHtml)

  if (extracto === '') {
    return { bajada: '', motivo: 'vacia' }
  }

  if (CONTINUACION.test(extracto)) {
    return { bajada: '', motivo: 'con-puntos-suspensivos' }
  }

  // El extracto automático son las primeras palabras del cuerpo, literales.
  const principio = comparable(extracto).slice(0, LARGO_DE_COMPARACION)
  if (principio.length >= 20 && comparable(cuerpoTexto).startsWith(principio)) {
    return { bajada: '', motivo: 'copiada-del-cuerpo' }
  }

  // Cortado a mitad de oración: es el caso del blueprint, "…quedará en la
  // historia. No", que no termina en ningún signo de cierre.
  if (!TERMINA_BIEN.test(extracto)) {
    return { bajada: '', motivo: 'truncada' }
  }

  return { bajada: extracto, motivo: null }
}
