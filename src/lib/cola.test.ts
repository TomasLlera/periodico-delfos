import { describe, expect, it } from 'vitest'
import {
  enOrdenDeCarga,
  estadoDeLaCola,
  eventosVisibles,
  pendienteComoEvento,
  pendienteNuevo,
  preocupa,
  type EventoPendiente,
} from './cola'
import type { EventoNuevo } from '@/actions/eventos'
import type { EventoConJugadora, FormacionConJugadora, Jugadora } from '@/types'

const PARTIDO = '0e5f7a10-0000-4000-8000-0000000000f0'
const ALDOSIVI = '0e5f7a10-0000-4000-8000-0000000000f1'
const CORTADI = '0e5f7a10-0000-4000-8000-0000000000f2'
const GARRO = '0e5f7a10-0000-4000-8000-0000000000f3'

function jugadora(id: string, apellido: string): Jugadora {
  return {
    id,
    nombre: 'N',
    apellido,
    slug: apellido.toLowerCase(),
    posicion: 'delantera',
    fecha_nacimiento: null,
    foto_url: null,
    lugar_origen: null,
    bio: null,
    activa: true,
  }
}

const FORMACIONES: FormacionConJugadora[] = [
  { partido_id: PARTIDO, jugadora_id: CORTADI, es_titular: true, dorsal: 10, posicion: null, jugadora: jugadora(CORTADI, 'Cortadi') },
  { partido_id: PARTIDO, jugadora_id: GARRO, es_titular: false, dorsal: 9, posicion: null, jugadora: jugadora(GARRO, 'Garro') },
]

function evento(id: string, minuto: number, jugadoraId: string | null = CORTADI): EventoNuevo {
  return {
    id,
    partido_id: PARTIDO,
    tipo: 'gol',
    minuto,
    adicionado: 0,
    equipo_id: ALDOSIVI,
    jugadora_id: jugadoraId,
    jugadora_nombre: jugadoraId ? null : 'Pérez',
    jugadora_sale_id: null,
  }
}

function pendiente(id: string, creado: string, intentos = 0): EventoPendiente {
  return { id, evento: evento(id, 23), creado, intentos }
}

describe('pendienteNuevo', () => {
  it('usa el id del evento: es la clave de idempotencia', () => {
    const p = pendienteNuevo(evento('abc', 23), new Date('2026-08-02T18:31:00.000Z'))
    expect(p.id).toBe('abc')
    expect(p.intentos).toBe(0)
    expect(p.creado).toBe('2026-08-02T18:31:00.000Z')
  })
})

describe('enOrdenDeCarga', () => {
  /**
   * Importa para los cambios: dos eventos del mismo minuto tienen que subir
   * como se cargaron, no como los ordene el minuto.
   */
  it('respeta el orden en que se tocaron, no el del minuto', () => {
    const cola = [
      pendiente('b', '2026-08-02T18:32:00.000Z'),
      pendiente('a', '2026-08-02T18:31:00.000Z'),
    ]
    expect(enOrdenDeCarga(cola).map((p) => p.id)).toEqual(['a', 'b'])
  })
})

describe('pendienteComoEvento', () => {
  it('resuelve la jugadora contra la formación, sin ir al servidor', () => {
    const e = pendienteComoEvento(pendiente('x', '2026-08-02T18:31:00.000Z'), FORMACIONES)
    expect(e.jugadora?.apellido).toBe('Cortadi')
  })

  it('un evento del rival no tiene jugadora y conserva el nombre escrito', () => {
    const p: EventoPendiente = {
      id: 'y',
      evento: evento('y', 30, null),
      creado: '2026-08-02T18:31:00.000Z',
      intentos: 0,
    }
    const e = pendienteComoEvento(p, FORMACIONES)
    expect(e.jugadora).toBe(null)
    expect(e.jugadora_nombre).toBe('Pérez')
  })

  it('conserva el id, que es el que va a tener en la base', () => {
    expect(pendienteComoEvento(pendiente('z', '2026-08-02T18:31:00.000Z'), FORMACIONES).id).toBe('z')
  })
})

describe('eventosVisibles', () => {
  const guardado: EventoConJugadora = {
    ...pendienteComoEvento(pendiente('ya-esta', '2026-08-02T18:30:00.000Z'), FORMACIONES),
  }

  it('muestra lo guardado y lo pendiente junto', () => {
    const visibles = eventosVisibles([guardado], [pendiente('nuevo', '2026-08-02T18:31:00.000Z')], FORMACIONES)
    expect(visibles.map((e) => e.id)).toEqual(['ya-esta', 'nuevo'])
  })

  /**
   * El caso que importa: el evento subió y todavía no se sacó de la cola. Sin
   * el filtro, el mismo gol aparece dos veces, que es justo el error que esta
   * pantalla existe para evitar.
   */
  it('no duplica el que ya subió pero sigue en la cola', () => {
    const visibles = eventosVisibles(
      [guardado],
      [pendiente('ya-esta', '2026-08-02T18:30:00.000Z')],
      FORMACIONES,
    )
    expect(visibles).toHaveLength(1)
  })

  it('sin cola, devuelve lo guardado tal cual', () => {
    expect(eventosVisibles([guardado], [], FORMACIONES)).toHaveLength(1)
  })
})

describe('preocupa', () => {
  it('los primeros intentos fallidos son señal mala, no un problema', () => {
    expect(preocupa(pendiente('a', '2026-08-02T18:31:00.000Z', 2))).toBe(false)
  })

  it('al tercero ya hay que mirarlo', () => {
    expect(preocupa(pendiente('a', '2026-08-02T18:31:00.000Z', 3))).toBe(true)
  })
})

describe('estadoDeLaCola', () => {
  const uno = [pendiente('a', '2026-08-02T18:31:00.000Z')]
  const dos = [...uno, pendiente('b', '2026-08-02T18:32:00.000Z')]

  it('sin cola no dice nada: una barra que avisa que todo está bien es ruido', () => {
    expect(estadoDeLaCola([], true)).toBe(null)
  })

  it('con conexión, está subiendo', () => {
    expect(estadoDeLaCola(uno, true)).toBe('Subiendo 1 evento…')
  })

  it('sin conexión, está esperando, y lo dice en plural cuando corresponde', () => {
    expect(estadoDeLaCola(dos, false)).toContain('2 eventos esperando')
  })

  it('lo que falló varias veces pide que alguien haga algo', () => {
    const roto = [pendiente('a', '2026-08-02T18:31:00.000Z', 4)]
    expect(estadoDeLaCola(roto, true)).toContain('no cierres la planilla')
  })
})
