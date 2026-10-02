/**
 * El identificador de un video de YouTube, sacado de cualquiera de las URL que
 * YouTube reparte.
 *
 * **Se guarda el id y no la URL.** Un `<iframe src>` armado con lo que alguien
 * pegó es una inyección esperando: basta un `javascript:` o un dominio ajeno
 * para que el cuerpo de una nota cargue lo que quiera. Guardando once
 * caracteres validados, la URL del iframe la arma este código y no el que
 * escribe. Es el mismo criterio que el `partidoId` del nodo `planilla`.
 *
 * YouTube tiene cinco formas de nombrar el mismo video y Charlie va a pegar la
 * que le dé el botón "Compartir" del celular, que es la corta:
 *
 *     https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *     https://youtu.be/dQw4w9WgXcQ?si=xxxx
 *     https://www.youtube.com/shorts/dQw4w9WgXcQ
 *     https://www.youtube.com/embed/dQw4w9WgXcQ
 *     https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=90s
 */

/** Los ids son 11 caracteres de un alfabeto propio de YouTube. */
const ID_VALIDO = /^[A-Za-z0-9_-]{11}$/

const DOMINIOS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
])

/**
 * Devuelve el id, o `null` si lo pegado no es un video de YouTube.
 *
 * **Acepta un id pelado**, porque es lo que queda guardado en el documento y
 * esta misma función lo revalida al renderizar.
 */
export function idDeYouTube(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const texto = valor.trim()
  if (texto === '') return null

  if (ID_VALIDO.test(texto)) return texto

  let url: URL
  try {
    // Sin protocolo `new URL` tira. Pegar "youtu.be/xxxx" es lo bastante común
    // como para no castigarlo.
    url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`)
  } catch {
    return null
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (!DOMINIOS.has(url.hostname.toLowerCase())) return null

  // youtu.be/ID y las rutas /shorts/ID, /embed/ID, /v/ID y /live/ID.
  const partes = url.pathname.split('/').filter(Boolean)
  const esCorta = url.hostname.toLowerCase().endsWith('youtu.be')

  const candidato = esCorta
    ? partes[0]
    : ['shorts', 'embed', 'v', 'live'].includes(partes[0] ?? '')
      ? partes[1]
      : url.searchParams.get('v')

  return candidato && ID_VALIDO.test(candidato) ? candidato : null
}

/**
 * La URL del iframe.
 *
 * `youtube-nocookie.com` y no `youtube.com`: el dominio sin cookies no deja
 * rastreadores hasta que alguien aprieta play. El sitio todavía no tiene
 * política de privacidad —ver `<Footer />`— y un embed que trackea a cada
 * lector por abrir una nota es justo lo que esa política tendría que declarar.
 */
export function urlEmbebidaDeYouTube(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`
}

/** La miniatura, para la vista previa del panel sin cargar el reproductor. */
export function miniaturaDeYouTube(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}
