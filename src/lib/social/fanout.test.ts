import { describe, expect, it } from 'vitest'
import {
  agotada,
  explicarSalteo,
  INTENTOS_MAXIMOS,
  planDeFanout,
  redesAIntentar,
} from './fanout'
import type { EstadoPosteo, Red, SocialPost } from '@/types'

const TODAS: Red[] = ['facebook', 'instagram', 'x']
const conTodo = () => true

function registro(
  platform: Red,
  status: EstadoPosteo,
  attempts = 0,
): Pick<SocialPost, 'platform' | 'status' | 'attempts'> {
  return { platform, status, attempts }
}

describe('planDeFanout', () => {
  it('sin nada posteado, se intentan las tres', () => {
    expect(redesAIntentar(planDeFanout(TODAS, [], conTodo))).toEqual(TODAS)
  })

  it('devuelve las tres siempre, aunque no se intenten: el panel las tiene que mostrar', () => {
    expect(planDeFanout(['x'], [], conTodo)).toHaveLength(3)
  })

  it('no intenta las redes que la nota no eligió', () => {
    const plan = planDeFanout(['facebook'], [], conTodo)
    expect(redesAIntentar(plan)).toEqual(['facebook'])
    expect(plan.find((p) => p.red === 'x')?.motivo).toBe('no-elegida')
  })

  /** La regla no negociable 5: reintentar no duplica. */
  it('no vuelve a postear lo que ya salió bien', () => {
    const plan = planDeFanout(TODAS, [registro('facebook', 'success')], conTodo)
    expect(redesAIntentar(plan)).toEqual(['instagram', 'x'])
    expect(plan.find((p) => p.red === 'facebook')?.motivo).toBe('ya-posteada')
  })

  /**
   * El caso que de verdad duplica: otra corrida lo tomó y todavía no terminó.
   * Por eso el registro se marca `processing` antes de llamar a la red.
   */
  it('no toca lo que otra corrida tiene en curso', () => {
    const plan = planDeFanout(TODAS, [registro('instagram', 'processing')], conTodo)
    expect(redesAIntentar(plan)).toEqual(['facebook', 'x'])
    expect(plan.find((p) => p.red === 'instagram')?.motivo).toBe('en-curso')
  })

  it('lo que falló sí se reintenta: para eso se guardó el error', () => {
    const plan = planDeFanout(TODAS, [registro('x', 'failed', 2)], conTodo)
    expect(redesAIntentar(plan)).toContain('x')
    expect(plan.find((p) => p.red === 'x')?.intentosPrevios).toBe(2)
  })

  it('lo que está pendiente también', () => {
    const plan = planDeFanout(TODAS, [registro('x', 'pending')], conTodo)
    expect(redesAIntentar(plan)).toContain('x')
  })

  it('una red sin credenciales no se intenta, y lo dice', () => {
    const plan = planDeFanout(TODAS, [], (red) => red !== 'instagram')
    expect(redesAIntentar(plan)).toEqual(['facebook', 'x'])
    expect(plan.find((p) => p.red === 'instagram')?.motivo).toBe('sin-credenciales')
  })

  /**
   * El orden importa poco, pero tiene que ser estable: el panel lista los
   * posteos y saltar de orden entre cargas se lee como si algo hubiera
   * cambiado.
   */
  it('el orden es siempre el mismo', () => {
    expect(planDeFanout(['x', 'facebook'], [], conTodo).map((p) => p.red)).toEqual(TODAS)
  })
})

describe('explicarSalteo', () => {
  it('una red que se va a intentar no tiene nada que explicar', () => {
    const plan = planDeFanout(TODAS, [], conTodo)
    expect(explicarSalteo(plan[0])).toBe(null)
  })

  it('explica en castellano y con el nombre de la red', () => {
    const plan = planDeFanout(TODAS, [registro('facebook', 'success')], conTodo)
    expect(explicarSalteo(plan[0])).toBe('Ya se había posteado en Facebook.')
  })

  it('la falta de credenciales se dice como lo que es', () => {
    const plan = planDeFanout(TODAS, [], (red) => red !== 'x')
    expect(explicarSalteo(plan[2])).toBe('Faltan las credenciales de X.')
  })
})

describe('agotada', () => {
  it('los primeros intentos no agotan nada', () => {
    const plan = planDeFanout(TODAS, [registro('x', 'failed', 1)], conTodo)
    expect(agotada(plan[2])).toBe(false)
  })

  /**
   * Cuatro fallas seguidas no son un problema de red: son un problema de
   * configuración, y seguir intentando lo esconde.
   */
  it('al cuarto intento acumulado se da por perdida', () => {
    const plan = planDeFanout(TODAS, [registro('x', 'failed', INTENTOS_MAXIMOS)], conTodo)
    expect(agotada(plan[2])).toBe(true)
  })
})
