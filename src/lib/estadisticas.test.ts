import { describe, expect, it } from 'vitest'
import {
  fechasDelRango,
  filasTop,
  nombreDeRuta,
  pestanaDeEstadisticas,
  rangoPedido,
  serieDiaria,
  slugDeNota,
  totalesDelRango,
} from '@/lib/estadisticas'

describe('rangoPedido', () => {
  it('acepta los dos que existen', () => {
    expect(rangoPedido('7')).toBe(7)
    expect(rangoPedido('30')).toBe(30)
  })

  /** 90 dias devolveria una serie con el principio vacio: Hobby guarda un mes. */
  it('cae en 7 con cualquier otra cosa', () => {
    expect(rangoPedido('90')).toBe(7)
    expect(rangoPedido('todo')).toBe(7)
    expect(rangoPedido(undefined)).toBe(7)
    expect(rangoPedido(['30', '7'])).toBe(30)
  })
})

describe('fechasDelRango', () => {
  const ahora = new Date('2026-10-11T15:00:00Z')

  it('siete dias incluye hoy', () => {
    expect(fechasDelRango(7, ahora)).toEqual({ since: '2026-10-05', until: '2026-10-11' })
  })

  it('treinta dias', () => {
    expect(fechasDelRango(30, ahora)).toEqual({ since: '2026-09-12', until: '2026-10-11' })
  })

  /**
   * La API agrupa en UTC. Pedir el rango en hora de Argentina cortaria el
   * primer y el ultimo dia a la mitad.
   */
  it('calcula en UTC y no con el reloj local', () => {
    expect(fechasDelRango(7, new Date('2026-10-11T02:00:00Z')).until).toBe('2026-10-11')
  })
})

describe('serieDiaria', () => {
  it('recorta el timestamp al dia y ordena', () => {
    const filas = [
      { timestamp: '2026-10-02T00:00:00.000Z', pageviews: 245, visitors: 201 },
      { timestamp: '2026-10-01T00:00:00.000Z', pageviews: 220, visitors: 180 },
    ]
    expect(serieDiaria(filas)).toEqual([
      { dia: '2026-10-01', vistas: 220, visitantes: 180 },
      { dia: '2026-10-02', vistas: 245, visitantes: 201 },
    ])
  })

  it('descarta una fila rara en vez de romper el grafico', () => {
    const filas = [{ pageviews: 10 }, { timestamp: '2026-10-01T00:00:00.000Z', pageviews: 5 }]
    expect(serieDiaria(filas)).toHaveLength(1)
  })

  it('un numero que no llego vale cero y no NaN', () => {
    const filas = [{ timestamp: '2026-10-01T00:00:00.000Z' }]
    expect(serieDiaria(filas)[0]).toEqual({ dia: '2026-10-01', vistas: 0, visitantes: 0 })
  })
})

describe('totalesDelRango', () => {
  it('suma la serie', () => {
    const serie = [
      { dia: '2026-10-01', vistas: 220, visitantes: 180 },
      { dia: '2026-10-02', vistas: 245, visitantes: 201 },
    ]
    expect(totalesDelRango(serie)).toEqual({ vistas: 465, visitantes: 381 })
  })

  it('una serie vacia da cero y no undefined', () => {
    expect(totalesDelRango([])).toEqual({ vistas: 0, visitantes: 0 })
  })
})

describe('filasTop', () => {
  it('lee la dimension que corresponde y ordena por vistas', () => {
    const filas = [
      { country: 'BR', pageviews: 20, visitors: 15 },
      { country: 'AR', pageviews: 640, visitors: 510 },
    ]
    expect(filasTop(filas, 'country').map((f) => f.clave)).toEqual(['AR', 'BR'])
  })

  /** Con la dimension equivocada la tabla saldria con filas vacias. */
  it('descarta las filas que no traen esa dimension', () => {
    const filas = [{ country: 'AR', pageviews: 10, visitors: 8 }]
    expect(filasTop(filas, 'deviceType')).toEqual([])
  })

  /** Vercel agrupa en `Others` lo que no entra en el limit: es una fila real. */
  it('deja pasar Others, que es un dato y no basura', () => {
    const filas = [{ requestPath: 'Others', pageviews: 30, visitors: 25 }]
    expect(filasTop(filas, 'requestPath')[0]?.clave).toBe('Others')
  })
})

describe('slugDeNota', () => {
  it('reconoce la ruta de una nota', () => {
    expect(slugDeNota('/nota/tiburonas-6-1-claypole')).toBe('tiburonas-6-1-claypole')
    expect(slugDeNota('/nota/tiburonas-6-1-claypole/')).toBe('tiburonas-6-1-claypole')
  })

  it('ignora lo que no es una nota', () => {
    expect(slugDeNota('/')).toBeNull()
    expect(slugDeNota('/cronicas')).toBeNull()
    expect(slugDeNota('/partido/fecha-4-aldosivi-claypole-2026')).toBeNull()
    expect(slugDeNota('/nota')).toBeNull()
    expect(slugDeNota('/nota/una/dos')).toBeNull()
  })

  it('saca el querystring, que llega pegado', () => {
    expect(slugDeNota('/nota/una-nota?utm_source=ig')).toBe('una-nota')
  })
})

describe('nombreDeRuta', () => {
  it('la portada tiene nombre y no barra', () => {
    expect(nombreDeRuta('/')).toBe('Portada')
    expect(nombreDeRuta('/cronicas')).toBe('/cronicas')
  })
})

describe('pestanaDeEstadisticas', () => {
  it('reconoce las cuatro', () => {
    expect(pestanaDeEstadisticas('notas')).toBe('notas')
    expect(pestanaDeEstadisticas('secciones')).toBe('secciones')
    expect(pestanaDeEstadisticas('origen')).toBe('origen')
    expect(pestanaDeEstadisticas('publico')).toBe('publico')
  })

  /** `?ver=` es entrada de usuario: no puede romper la pagina. */
  it('cae en notas con cualquier otra cosa', () => {
    expect(pestanaDeEstadisticas('cualquiera')).toBe('notas')
    expect(pestanaDeEstadisticas(undefined)).toBe('notas')
    expect(pestanaDeEstadisticas([''])).toBe('notas')
  })
})
