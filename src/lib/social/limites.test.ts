import { describe, expect, it } from 'vitest'
import {
  LARGO_DE_URL,
  LARGO_MAXIMO_X,
  largoEnX,
  pesoDeTexto,
  recortarAPeso,
} from '@/lib/social/limites'

describe('pesoDeTexto', () => {
  it('cuenta 1 por carácter latino, acentos y eñe incluidos', () => {
    expect(pesoDeTexto('Aldosivi')).toBe(8)
    // Los acentos son lo que más aparece en el copy en español: si pesaran 2,
    // cada bajada perdería una docena de caracteres que sí entraban.
    expect(pesoDeTexto('áéíóúüñÁÉÍÓÚÑ')).toBe(13)
    expect(pesoDeTexto('¡Vamos, Tiburonas!')).toBe(18)
  })

  it('cuenta 1 la puntuación tipográfica del copy', () => {
    // El punto medio separa los bloques del encabezado y la raya aparece en los
    // títulos migrados de WordPress.
    expect(pesoDeTexto('·')).toBe(1)
    expect(pesoDeTexto('–')).toBe(1)
    expect(pesoDeTexto('—')).toBe(1)
    expect(pesoDeTexto('\n')).toBe(1)
  })

  it('cuenta 2 por emoji, que son los que abren cada forma de copy', () => {
    expect(pesoDeTexto('⚽')).toBe(2)
    expect(pesoDeTexto('🔍')).toBe(2)
    expect(pesoDeTexto('📅')).toBe(2)
    expect(pesoDeTexto('🔗')).toBe(2)
    expect(pesoDeTexto('…')).toBe(2)
  })

  it('cuenta el emoji una vez y no dos, aunque en JavaScript mida dos', () => {
    // `'🔗'.length` es 2: es un par suplente. Para X es un solo carácter de
    // peso 2. Contar por unidades UTF-16 lo cobraría 4.
    expect('🔗'.length).toBe(2)
    expect(pesoDeTexto('🔗')).toBe(2)
    expect(pesoDeTexto('⚽ Gol')).toBe(2 + 1 + 3)
  })

  it('el texto vacío pesa 0', () => {
    expect(pesoDeTexto('')).toBe(0)
  })
})

describe('largoEnX', () => {
  const CORTA = 'https://pd.ar/a'
  const LARGA =
    'https://periodicodelfos.com/nota/tiburonas-0-1-all-boys-fecha-11-primera-b-2026-cronica'

  it('cobra 23 por un link, sea corto o larguísimo', () => {
    expect(largoEnX(CORTA)).toBe(LARGO_DE_URL)
    expect(largoEnX(LARGA)).toBe(LARGO_DE_URL)
  })

  it('el largo real del link no cambia nada: esa es toda la gracia', () => {
    // 87 caracteres contra 15, y para X pesan lo mismo. Medir con `.length`
    // tiraría 64 caracteres de bajada que entraban.
    expect(LARGA.length).toBeGreaterThan(CORTA.length + 60)
    expect(largoEnX(LARGA)).toBe(largoEnX(CORTA))
    expect(pesoDeTexto(LARGA)).not.toBe(pesoDeTexto(CORTA))
  })

  it('cuenta el texto alrededor del link con su peso normal', () => {
    expect(largoEnX(`Mirá ${CORTA} ahora`)).toBe(5 + LARGO_DE_URL + 6)
  })

  it('cobra 23 por cada link cuando hay más de uno', () => {
    expect(largoEnX(`${CORTA} y ${LARGA}`)).toBe(LARGO_DE_URL + 3 + LARGO_DE_URL)
  })

  it('corta el link en el espacio en blanco y no se come lo que sigue', () => {
    // El `\n` antes de los hashtags es lo único que separa el link del resto
    // de la cola: si `\S+` se lo llevara puesto, los hashtags saldrían gratis.
    const cola = `🔗 ${LARGA}\n#Aldosivi`
    expect(largoEnX(cola)).toBe(2 + 1 + LARGO_DE_URL + 1 + 9)
  })

  it('sin links es lo mismo que el peso', () => {
    expect(largoEnX('⚽ Fecha 11 · Aldosivi 0-1 All Boys')).toBe(
      pesoDeTexto('⚽ Fecha 11 · Aldosivi 0-1 All Boys'),
    )
  })

  it('el límite de X son 280', () => {
    expect(LARGO_MAXIMO_X).toBe(280)
  })
})

describe('recortarAPeso', () => {
  const FRASE = 'Aldosivi ganó de visitante y quedó a dos puntos de la punta'

  it('devuelve el texto intacto si ya entra', () => {
    expect(recortarAPeso(FRASE, 500)).toBe(FRASE)
    expect(recortarAPeso(FRASE, pesoDeTexto(FRASE))).toBe(FRASE)
  })

  it('corta por palabra y cierra con puntos suspensivos', () => {
    expect(recortarAPeso(FRASE, 15)).toBe('Aldosivi ganó…')
  })

  it('nunca parte una palabra al medio', () => {
    // La propiedad, no un caso: para cualquier límite, lo que queda antes de
    // los puntos suspensivos es un prefijo de palabras enteras. Es el defecto
    // que tiene el extracto de WordPress y que no se puede repetir acá.
    for (let limite = 1; limite <= pesoDeTexto(FRASE) + 5; limite++) {
      const salida = recortarAPeso(FRASE, limite)
      if (salida === '') continue

      const contenido = salida.endsWith('…') ? salida.slice(0, -1) : salida
      expect(FRASE === contenido || FRASE.startsWith(`${contenido} `)).toBe(true)
    }
  })

  it('nunca se pasa del peso pedido, con puntos suspensivos y todo', () => {
    for (let limite = 1; limite <= pesoDeTexto(FRASE) + 5; limite++) {
      expect(pesoDeTexto(recortarAPeso(FRASE, limite))).toBeLessThanOrEqual(limite)
    }
  })

  it('devuelve vacío si no entra ni la primera palabra', () => {
    expect(recortarAPeso(FRASE, 3)).toBe('')
    expect(recortarAPeso(FRASE, 0)).toBe('')
    expect(recortarAPeso(FRASE, -10)).toBe('')
  })

  it('se come la coma o el punto que quedaban colgando antes del corte', () => {
    // "…de Defensa y Justicia,…" se lee como un error de tipeo.
    const conComa = 'Ganó Aldosivi, con gol de Cortadi'
    expect(recortarAPeso(conComa, 16)).toBe('Ganó Aldosivi…')
  })

  it('cuenta el peso y no los caracteres al decidir el corte', () => {
    // Cinco emoji son 5 caracteres de JavaScript y 10 de peso para X.
    const emoji = '⚽ ⚽ ⚽ ⚽ ⚽'
    expect(emoji.length).toBeLessThan(pesoDeTexto(emoji))
    expect(pesoDeTexto(recortarAPeso(emoji, 8))).toBeLessThanOrEqual(8)
  })

  it('un texto vacío se devuelve vacío y no inventa puntos suspensivos', () => {
    expect(recortarAPeso('', 100)).toBe('')
  })
})
