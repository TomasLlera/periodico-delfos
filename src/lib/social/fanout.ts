/**
 * Qué se postea y qué no, sin Inngest y sin red.
 *
 * Es la lógica de la regla no negociable 5 —**todo posteo es idempotente vía
 * `social_posts (nota_id, platform)`**— separada de la función durable que la
 * ejecuta, para poder probarla sin levantar Inngest ni pegarle a Meta.
 *
 * El error que esto previene es el peor del pipeline y no tiene vuelta atrás:
 * una función que se reintenta —porque Instagram tardó, porque Vercel cortó el
 * request, porque alguien tocó "reintentar"— y vuelve a publicar el mismo
 * posteo. Borrarlo de las tres redes después es trabajo a mano, y mientras
 * tanto quedó publicado dos veces.
 */

import type { EstadoPosteo, Red, SocialPost } from '@/types'

/** Las tres, en el orden en que se intentan. */
export const REDES: readonly Red[] = ['facebook', 'instagram', 'x']

export const NOMBRE_RED: Record<Red, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X',
}

/** Por qué una red no se va a intentar en esta corrida. */
export type MotivoSalteo = 'ya-posteada' | 'en-curso' | 'no-elegida' | 'sin-credenciales'

export interface PlanDeRed {
  red: Red
  /** `false` cuando no hay que hacer nada con esta red. */
  intentar: boolean
  motivo?: MotivoSalteo
  /** Los intentos que ya lleva. Entra en el registro para poder mirarlo después. */
  intentosPrevios: number
}

/**
 * Los estados que **no** se vuelven a intentar.
 *
 * `success` es obvio. `processing` es el que importa: significa que otra
 * corrida de la misma función lo tomó y todavía no terminó, y reintentarlo en
 * paralelo es exactamente cómo se publica dos veces. El registro se marca
 * `processing` **antes** de llamar a la red, no después.
 *
 * `failed` sí se reintenta: para eso se guarda el error.
 */
const TERMINADOS: readonly EstadoPosteo[] = ['success', 'processing']

/**
 * Lo que **no** se vuelve a intentar ni forzando a mano.
 *
 * Sólo lo que ya salió. Un reintento manual tiene que poder destrabar un
 * `processing` que quedó colgado —una corrida que murió después de marcar y
 * antes de postear deja esa red trabada para siempre— pero jamás volver a
 * publicar algo que está publicado: eso no se deshace desde acá.
 */
const TERMINADOS_FORZANDO: readonly EstadoPosteo[] = ['success']

/**
 * Qué hacer con cada red para una nota.
 *
 * Devuelve las tres siempre, con su motivo, y no sólo las que hay que postear:
 * el panel tiene que poder decir "Instagram no salió porque faltan las
 * credenciales" y no simplemente no mostrar nada.
 */
export function planDeFanout(
  redesElegidas: readonly Red[],
  registros: readonly Pick<SocialPost, 'platform' | 'status' | 'attempts'>[],
  conCredenciales: (red: Red) => boolean,
  /** Un reintento pedido a mano desde el panel, no una corrida automática. */
  forzado = false,
): PlanDeRed[] {
  const terminados = forzado ? TERMINADOS_FORZANDO : TERMINADOS

  return REDES.map((red) => {
    const registro = registros.find((r) => r.platform === red)
    const intentosPrevios = registro?.attempts ?? 0

    if (!redesElegidas.includes(red)) {
      return { red, intentar: false, motivo: 'no-elegida', intentosPrevios }
    }

    if (registro && terminados.includes(registro.status)) {
      return {
        red,
        intentar: false,
        motivo: registro.status === 'success' ? 'ya-posteada' : 'en-curso',
        intentosPrevios,
      }
    }

    if (!conCredenciales(red)) {
      return { red, intentar: false, motivo: 'sin-credenciales', intentosPrevios }
    }

    return { red, intentar: true, intentosPrevios }
  })
}

/** Las que efectivamente se van a intentar. */
export function redesAIntentar(plan: readonly PlanDeRed[]): Red[] {
  return plan.filter((p) => p.intentar).map((p) => p.red)
}

/**
 * La frase que explica por qué una red no se intentó.
 *
 * Va a parar a `social_posts.error_message` y al panel, así que está escrita
 * para alguien que quiere saber qué hacer, no para un log.
 */
export function explicarSalteo(plan: PlanDeRed): string | null {
  if (plan.intentar || !plan.motivo) return null

  switch (plan.motivo) {
    case 'ya-posteada':
      return `Ya se había posteado en ${NOMBRE_RED[plan.red]}.`
    case 'en-curso':
      return `El posteo a ${NOMBRE_RED[plan.red]} está en curso desde otro intento.`
    case 'no-elegida':
      return `${NOMBRE_RED[plan.red]} no estaba elegida en la nota.`
    case 'sin-credenciales':
      return `Faltan las credenciales de ${NOMBRE_RED[plan.red]}.`
  }
}

/**
 * Cuántas veces vale la pena reintentar una red antes de darla por perdida.
 *
 * Inngest reintenta solo con backoff; esto es el tope de intentos **acumulados
 * entre corridas**, que es distinto: una nota que falló cuatro veces en cuatro
 * días no tiene un problema de red, tiene un problema de configuración, y
 * seguir intentándola esconde el error en vez de mostrarlo.
 */
export const INTENTOS_MAXIMOS = 4

export function agotada(plan: PlanDeRed, forzado = false): boolean {
  // Forzar a mano es, justamente, decir "sé que falló cuatro veces, probá otra
  // vez": el tope existe para que el sistema no insista solo, no para impedir
  // que alguien lo intente después de arreglar la credencial.
  if (forzado) return false
  return plan.intentosPrevios >= INTENTOS_MAXIMOS
}
