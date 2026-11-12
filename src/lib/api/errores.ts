/**
 * El formato de error de la API, y la traducción de lo que falla a un código
 * HTTP.
 *
 * **Por qué existe.** El panel entra por Server Actions, y un Server Action
 * responde 200 (o una redirección) con el error adentro del cuerpo. Desde la
 * pestaña Network, desde Postman o desde un test, un login fallido y uno
 * exitoso se ven iguales: el mismo 200, el mismo tipo de respuesta. Las rutas
 * de `/api/*` existen para que el código de estado lo dé el servidor y haya
 * algo sobre lo cual afirmar. La interfaz sigue usando los Server Actions.
 *
 * **Un 500 nunca es un resultado esperado.** Es la regla de la clase 8 y es la
 * que ordena este archivo: todo error previsible —datos mal formados, falta de
 * sesión, falta de permiso, duplicado, base caída— se traduce a un 4xx o a un
 * 503. Lo que sale 500 es lo que nadie previó, queda en el log y es un defecto
 * a investigar, no una respuesta de diseño.
 *
 * **El cuerpo es siempre el mismo**, para que un cliente pueda leerlo sin
 * saber qué ruta llamó:
 *
 *     { "error": { "codigo": "texto_corto", "mensaje": "Explicación en español" } }
 *
 * `codigo` es para el código que decide; `mensaje` es para la persona que lee,
 * y por eso está en español (regla no negociable 9).
 */

export interface CuerpoError {
  error: {
    codigo: string
    mensaje: string
  }
}

/**
 * El mensaje de un cuerpo de error, leído desde el otro lado.
 *
 * Lo usan los formularios del panel, que ahora hablan con estas rutas por
 * `fetch`: lo que viene es `unknown` —puede ser el cuerpo esperado, puede ser
 * una página de error de la plataforma, puede no ser JSON— y hay que llegar al
 * texto sin romperse en el camino. Vive acá y no en cada formulario para que
 * el formato se lea en un solo lugar: si cambia, cambia una vez.
 */
export function mensajeDelError(cuerpo: unknown, porOmision: string): string {
  if (cuerpo !== null && typeof cuerpo === 'object' && 'error' in cuerpo) {
    const error = (cuerpo as { error?: unknown }).error

    if (error !== null && typeof error === 'object' && 'mensaje' in error) {
      const mensaje = (error as { mensaje?: unknown }).mensaje
      if (typeof mensaje === 'string' && mensaje.length > 0) return mensaje
    }
  }

  return porOmision
}

/** Un error ya traducido: el estado HTTP y lo que va en el cuerpo. */
export interface ErrorApi {
  estado: number
  codigo: string
  mensaje: string
}

export function cuerpoDeError({ codigo, mensaje }: ErrorApi): CuerpoError {
  return { error: { codigo, mensaje } }
}

/**
 * La respuesta HTTP de un error.
 *
 * `headers` es para el `Retry-After` del 503: decirle a quien llama cuándo
 * volver es la mitad de lo que hace útil a ese código.
 */
export function respuestaDeError(error: ErrorApi, headers?: Record<string, string>): Response {
  return Response.json(cuerpoDeError(error), { status: error.estado, headers })
}

/**
 * El catálogo. Son funciones y no constantes porque varios llevan un mensaje
 * propio de la ruta: el 400 de una búsqueda corta no dice lo mismo que el 400
 * de una nota sin título.
 */
export const ERRORES = {
  datosInvalidos: (mensaje: string): ErrorApi => ({
    estado: 400,
    codigo: 'datos_invalidos',
    mensaje,
  }),

  /**
   * **El mismo mensaje para "no existe" y para "contraseña equivocada".**
   * Distinguirlos le confirmaría a cualquiera qué mails tienen cuenta en el
   * panel probando de a uno. Es la misma decisión que ya toma el Server Action
   * en `src/actions/sesion.ts`, y acá se repite a propósito.
   */
  credencialesInvalidas: (): ErrorApi => ({
    estado: 401,
    codigo: 'credenciales_invalidas',
    mensaje: 'No pudimos entrar con esos datos.',
  }),

  sinSesion: (): ErrorApi => ({
    estado: 401,
    codigo: 'sin_sesion',
    mensaje: 'Necesitás iniciar sesión para hacer esto.',
  }),

  sinPermiso: (): ErrorApi => ({
    estado: 403,
    codigo: 'sin_permiso',
    mensaje: 'Tu cuenta no tiene permiso para hacer esto.',
  }),

  noEncontrada: (mensaje: string): ErrorApi => ({
    estado: 404,
    codigo: 'no_encontrada',
    mensaje,
  }),

  conflicto: (mensaje: string): ErrorApi => ({
    estado: 409,
    codigo: 'conflicto',
    mensaje,
  }),

  demasiadosIntentos: (): ErrorApi => ({
    estado: 429,
    codigo: 'demasiados_intentos',
    mensaje: 'Demasiados intentos seguidos. Esperá un momento y probá de nuevo.',
  }),

  servicioNoDisponible: (): ErrorApi => ({
    estado: 503,
    codigo: 'servicio_no_disponible',
    mensaje: 'El servicio no está disponible en este momento. Probá de nuevo en un rato.',
  }),

  interno: (): ErrorApi => ({
    estado: 500,
    codigo: 'error_interno',
    mensaje: 'Algo se rompió de nuestro lado. Ya quedó registrado.',
  }),
} as const

// ============================================
// Lectura de lo que viene fallado
// ============================================

/** `unique_violation`: dos filas con el mismo valor en una columna única. */
const UNIQUE = '23505'
/** `check_violation`: un CHECK de la base, como `minuto_valido`. */
const CHECK = '23514'
/** `invalid_datetime_format` y `datetime_field_overflow`. */
const FECHAS = ['22007', '22008']
/** `insufficient_privilege`: lo que devuelve una política de RLS. */
const RLS = '42501'

/** Códigos de `libuv`/`undici` cuando no se llega al otro lado. */
const CODIGOS_DE_RED = [
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
]

const TEXTOS_DE_RED = [
  'fetch failed',
  'network',
  'timeout',
  'timed out',
  'socket hang up',
  'service unavailable',
  'econnrefused',
  'enotfound',
  'etimedout',
]

/**
 * El código del error.
 *
 * Mira la propiedad `code` —que es lo que trae un `PostgrestError`— y, si no
 * está, lo busca entre paréntesis adentro del mensaje. Lo segundo no es un
 * truco: `exigir()` arma el texto `Supabase falló en getNotaPorSlug (23505):
 * ...` y tira un `Error` pelado, así que las queries que ya existen pierden la
 * propiedad por el camino. Soportar las dos formas es lo que permite
 * reutilizarlas sin reescribirlas.
 */
function codigoDe(error: unknown): string | null {
  if (error !== null && typeof error === 'object' && 'code' in error) {
    const codigo = (error as { code?: unknown }).code
    if (typeof codigo === 'string' && codigo.length > 0) return codigo
  }

  const encontrado = textoDe(error).match(/\(([0-9A-Z]{5})\)/)
  return encontrado ? encontrado[1] : null
}

function textoDe(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error

  if (error !== null && typeof error === 'object' && 'message' in error) {
    const mensaje = (error as { message?: unknown }).message
    if (typeof mensaje === 'string') return mensaje
  }

  return ''
}

function estadoHttpDe(error: unknown): number | null {
  if (error !== null && typeof error === 'object' && 'status' in error) {
    const estado = (error as { status?: unknown }).status
    if (typeof estado === 'number') return estado
  }
  return null
}

/**
 * `true` si el otro lado no contestó.
 *
 * Es lo que separa un 503 de un 500: el servicio no está, pero el pedido era
 * válido y dentro de un rato va a andar. Un 500 diría que el pedido rompió
 * algo, que es otra cosa y manda a buscar el problema donde no está.
 */
export function esErrorDeRed(error: unknown): boolean {
  const codigo = codigoDe(error)
  if (codigo !== null && CODIGOS_DE_RED.includes(codigo)) return true

  // `status: 0` es lo que trae `AuthRetryableFetchError` cuando el fetch ni
  // salió; 502/503/504 son la pasarela de Supabase diciendo que no llega.
  const estado = estadoHttpDe(error)
  if (estado === 0 || estado === 502 || estado === 503 || estado === 504) return true

  const texto = textoDe(error).toLowerCase()
  return TEXTOS_DE_RED.some((pedazo) => texto.includes(pedazo))
}

// ============================================
// Traducción
// ============================================

/**
 * De un error de Supabase o de Postgres al código HTTP que le corresponde.
 *
 * `haySesion` decide el único caso ambiguo: una política de RLS que rechaza
 * (`42501`) significa "no estás autenticado" si no hay sesión —401— y "estás,
 * pero esto no es tuyo" si la hay —403—. El mismo código de Postgres, dos
 * respuestas distintas, porque lo que tiene que hacer quien llama también es
 * distinto: en un caso entrar, en el otro pedir permiso.
 */
export function mapearErrorSupabase(error: unknown, { haySesion }: { haySesion: boolean }): ErrorApi {
  if (esErrorDeRed(error)) return ERRORES.servicioNoDisponible()

  const codigo = codigoDe(error)

  if (codigo === UNIQUE) {
    return ERRORES.conflicto('Ya existe un registro con ese valor. Revisá los campos únicos.')
  }

  if (codigo === CHECK) {
    return ERRORES.datosInvalidos('Alguno de los datos no cumple una regla de la base.')
  }

  if (codigo !== null && FECHAS.includes(codigo)) {
    return ERRORES.datosInvalidos('La fecha no tiene un formato válido.')
  }

  if (codigo === RLS) {
    return haySesion ? ERRORES.sinPermiso() : ERRORES.sinSesion()
  }

  // Lo que llega acá no estaba previsto, y por eso se registra: un 500 en los
  // logs es el principio de un defecto, no el final de un pedido.
  console.error('[api] error no previsto de Supabase:', error)
  return ERRORES.interno()
}

/** Los códigos con los que GoTrue dice "esas credenciales no sirven". */
const CODIGOS_DE_CREDENCIALES = [
  'invalid_credentials',
  'invalid_grant',
  'invalid_login_credentials',
  'user_not_found',
  'email_not_confirmed',
]

/** Los códigos con los que GoTrue dice "pediste demasiado seguido". */
const CODIGOS_DE_LIMITE = ['over_request_rate_limit', 'over_email_send_rate_limit']

/**
 * De un error de Supabase Auth al código HTTP que le corresponde.
 *
 * **Acá la API se aparta de Supabase a propósito, y conviene que quede
 * escrito.** GoTrue responde **400** ante una contraseña incorrecta o un
 * usuario inexistente, y reserva el 401 para cuando el token falta o no se
 * puede decodificar. Es coherente de su lado, pero la tabla de la materia
 * —clase 8— asigna el 401 a "falta login o credenciales inválidas", que es
 * exactamente esta situación. Nuestra ruta **traduce ese 400 a 401** para
 * quedar alineada con esa tabla. El 400 de esta API queda para lo que de
 * verdad viene mal formado: un cuerpo que no es JSON, un mail sin arroba, una
 * contraseña ausente.
 */
export function mapearErrorDeAuth(error: unknown): ErrorApi {
  if (esErrorDeRed(error)) return ERRORES.servicioNoDisponible()

  const codigo = codigoDe(error)
  const estado = estadoHttpDe(error)

  if ((codigo !== null && CODIGOS_DE_LIMITE.includes(codigo)) || estado === 429) {
    return ERRORES.demasiadosIntentos()
  }

  if (codigo !== null && CODIGOS_DE_CREDENCIALES.includes(codigo)) {
    return ERRORES.credencialesInvalidas()
  }

  // El 400 de GoTrue, traducido. Ver el comentario de arriba.
  if (estado === 400 || estado === 401 || estado === 422) {
    return ERRORES.credencialesInvalidas()
  }

  console.error('[api] error no previsto de Auth:', error)
  return ERRORES.interno()
}
