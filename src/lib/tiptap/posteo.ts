/**
 * Un posteo de Instagram o de X citado en el cuerpo de una nota.
 *
 * **No es el embed oficial de la plataforma, y es la decisión del nodo.** El
 * embed de las dos es un `<blockquote>` más un `<script>` de la plataforma, y
 * tiene tres problemas que no se arreglan configurándolo:
 *
 * 1. Pesa cientos de kilobytes por posteo y se carga en la misma pantalla donde
 *    alguien está leyendo una crónica de 4 kB.
 * 2. Deja cookies de terceros, y el sitio todavía no tiene política de
 *    privacidad. Es el mismo criterio con el que el nodo `video` va al dominio
 *    `youtube-nocookie.com`.
 * 3. **El bloque desaparece si borran el posteo.** Una nota de hace dos años
 *    queda con un hueco donde estaba la cita, y nadie lo mira hasta que lo mira.
 *
 * Así que lo que se guarda es una cita: el texto, quién lo escribió y el link al
 * original. La tarjeta la dibuja el sitio con sus propios tokens
 * (`<PosteoCitado />`), pesa cero y **sigue diciendo lo mismo cuando el posteo
 * ya no está**, que es la única parte que no se puede recuperar después.
 *
 * **La URL la arma este módulo y nunca es la que se pegó.** Es el mismo
 * criterio que `idDeYouTube()`: se parsea lo pegado, se valida pieza por pieza
 * contra una lista blanca y se vuelve a armar la URL canónica desde las piezas.
 * Un `href` que sale directo de lo que alguien escribió en el panel es una
 * inyección esperando, y acá además entra texto que puede venir de la migración
 * de WordPress o de una fila editada a mano.
 */

import type { ClaveDeRed } from '@/lib/logos-redes'

/** Las dos redes que se pueden citar. El resto no tiene tarjeta. */
export type RedDePosteo = Extract<ClaveDeRed, 'instagram' | 'x'>

export interface DatosDePosteo {
  red: RedDePosteo
  /** La URL canónica, armada acá a partir de las piezas validadas. */
  url: string
  /**
   * El handle, sin arroba, si la URL lo trae.
   *
   * X lo trae siempre —`x.com/handle/status/123`— y una URL de Instagram casi
   * nunca: `instagram.com/p/CÓDIGO/` no dice de quién es el posteo. Por eso el
   * panel lo pide a mano y esto sólo sirve para prellenarlo cuando se puede.
   */
  usuario: string | null
}

/**
 * Los dominios que se aceptan, y a qué red corresponde cada uno.
 *
 * `twitter.com` sigue en la lista: un posteo viejo pegado desde Twitter es un
 * posteo de X, y la tarjeta lo va a mostrar como "X" porque es como se llama
 * hoy la plataforma. Los subdominios de celular (`m.`, `mobile.`) entran porque
 * son los que da el botón Compartir de la app.
 *
 * Es una lista blanca: lo que no está enumerado no pasa. `instagram.com.evil.io`
 * no es `instagram.com`, y comparar con `endsWith()` diría que sí.
 */
const DOMINIOS: Record<string, RedDePosteo | undefined> = {
  'instagram.com': 'instagram',
  'www.instagram.com': 'instagram',
  'm.instagram.com': 'instagram',
  'x.com': 'x',
  'www.x.com': 'x',
  'mobile.x.com': 'x',
  'twitter.com': 'x',
  'www.twitter.com': 'x',
  'mobile.twitter.com': 'x',
  'm.twitter.com': 'x',
}

/**
 * Las tres formas en que Instagram nombra un posteo, más la que quedó vieja.
 *
 * `reels` (en plural) es la que reparte la app desde 2023 y `reel` la que usa la
 * web; las dos llevan al mismo lugar, así que se normalizan a `reel`. `tv` es
 * de IGTV, que ya no existe como producto pero cuyos links siguen vivos.
 */
const TIPOS_DE_INSTAGRAM: Record<string, string | undefined> = {
  p: 'p',
  reel: 'reel',
  reels: 'reel',
  tv: 'tv',
}

/** El código corto de un posteo de Instagram: base64 url-safe, 5 a 30. */
const CODIGO_INSTAGRAM = /^[A-Za-z0-9_-]{5,30}$/

/** Un handle de Instagram: letras, números, punto y guión bajo. */
const USUARIO_INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/

/** Un handle de X: 15 caracteres, sin puntos ni guiones. */
const USUARIO_X = /^[A-Za-z0-9_]{1,15}$/

/** El id de un posteo de X es un número, y ya pasó los 19 dígitos. */
const ID_X = /^[0-9]{1,25}$/

/**
 * Lee lo que alguien pegó y devuelve las piezas de un posteo, o `null`.
 *
 * **Acepta la URL sin protocolo** (`instagram.com/p/xxxx`), porque es lo que
 * queda al copiar de la barra del navegador en Safari y es lo bastante común
 * como para no castigarlo. `new URL()` sola tira con eso.
 */
export function datosDePosteo(valor: unknown): DatosDePosteo | null {
  if (typeof valor !== 'string') return null

  const texto = valor.trim()
  if (texto === '') return null

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`)
  } catch {
    return null
  }

  // Se apoya en el parser de `URL` y no en una expresión regular porque es el
  // mismo que aplica el navegador: normaliza mayúsculas y descarta
  // tabulaciones y saltos de línea intercalados, que son las dos formas
  // clásicas de esconder un esquema prohibido.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const red = DOMINIOS[url.hostname.toLowerCase()]
  if (!red) return null

  const partes = url.pathname.split('/').filter(Boolean)

  return red === 'instagram' ? deInstagram(partes) : deX(partes)
}

/**
 * Los segmentos de la ruta, como los deja `split('/')`.
 *
 * Se tipan con `undefined` adentro aunque `split()` no lo devuelva: el proyecto
 * no tiene `noUncheckedIndexedAccess`, así que sin esto `partes[2]` sería un
 * `string` para TypeScript y los `?.` y `??` de abajo parecerían de más —
 * cuando son justo lo que sostiene el caso de una URL recortada.
 */
type Segmentos = readonly (string | undefined)[]

/**
 * Instagram reparte el mismo posteo de dos formas: `/p/CÓDIGO/` y
 * `/usuario/p/CÓDIGO/`. La segunda trae el handle, que es el único lugar de
 * donde se puede sacar sin pedirle nada a la API.
 *
 * La URL canónica se arma **sin el handle**: `/p/CÓDIGO/` resuelve igual y es la
 * forma que no se rompe si la cuenta se cambia el nombre, que en Instagram pasa.
 */
function deInstagram(partes: Segmentos): DatosDePosteo | null {
  const conUsuario = TIPOS_DE_INSTAGRAM[partes[1]?.toLowerCase() ?? ''] !== undefined

  const usuario = conUsuario ? (partes[0] ?? null) : null
  const tipo = TIPOS_DE_INSTAGRAM[(conUsuario ? partes[1] : partes[0])?.toLowerCase() ?? '']
  const codigo = conUsuario ? partes[2] : partes[1]

  if (!tipo || !codigo || !CODIGO_INSTAGRAM.test(codigo)) return null

  return {
    red: 'instagram',
    url: `https://www.instagram.com/${tipo}/${codigo}/`,
    usuario: usuario && USUARIO_INSTAGRAM.test(usuario) ? usuario : null,
  }
}

/**
 * X reparte `/handle/status/ID`, el plural viejo `/statuses/ID`, y
 * `/i/web/status/ID` cuando el link sale de una cuenta que no se puede nombrar.
 *
 * Lo que venga después del id —`/photo/1`, `/video/1`— se descarta: lleva al
 * mismo posteo y la tarjeta no muestra la foto.
 */
function deX(partes: Segmentos): DatosDePosteo | null {
  // `/i/web/status/ID` y `/i/status/ID`: el id está después de `status` y no hay
  // handle. Se busca la palabra en lugar de contar posiciones porque las dos
  // formas circulan y difieren en un segmento.
  if (partes[0]?.toLowerCase() === 'i') {
    const indice = partes.findIndex((parte) => parte?.toLowerCase() === 'status')
    const id = indice === -1 ? null : partes[indice + 1]
    if (!id || !ID_X.test(id)) return null
    return { red: 'x', url: `https://x.com/i/status/${id}`, usuario: null }
  }

  const [usuario, status, id] = partes
  const esStatus = status?.toLowerCase() === 'status' || status?.toLowerCase() === 'statuses'

  if (!usuario || !esStatus || !id) return null
  if (!USUARIO_X.test(usuario) || !ID_X.test(id)) return null

  return { red: 'x', url: `https://x.com/${usuario}/status/${id}`, usuario }
}
