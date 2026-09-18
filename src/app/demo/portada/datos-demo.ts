import type { NotaResumen } from '@/types'

/**
 * Las notas de verdad del sitio viejo, para mirar la portada sin Supabase.
 *
 * **Ya no son inventadas.** Títulos, bajadas, slugs y fechas salen de
 * `scripts/migrate-wp.ts` corrido en seco contra `periodicodelfos.com`. Los
 * títulos vienen **limpios**: el migrador les saca el sufijo
 * ": Fecha N°12 – Aldosivi Femenino en la Primera B 2026" que hacía que todos
 * se truncaran con "…" en la home vieja (blueprint 7.3). El slug sí lo conserva,
 * porque es la URL que hay que redirigir.
 *
 * **Viven acá y no en los componentes ni en `/`.** Los componentes no saben de
 * dónde salen sus datos, y `/` sigue leyendo la base, que hoy está vacía. Este
 * archivo se borra cuando la migración escriba de verdad.
 *
 * Ninguna nota tiene `imagen_portada`: el sitio viejo no tiene una sola imagen
 * con texto alternativo cargado y la regla no negociable 4 lo exige.
 */

const AUTOR = { nombre: 'Charlie Redondo', slug: 'charlie-redondo' }

/** Todo lo que `NotaResumen` pide y a la portada no le importa. */
function nota(
  parcial: Pick<NotaResumen, 'id' | 'titulo' | 'slug' | 'bajada' | 'categoria' | 'publicada_en'> &
    Partial<NotaResumen>,
): NotaResumen {
  return {
    imagen_portada: null,
    imagen_alt: '',
    imagen_credito: null,
    temporada_id: 'primera-b-2026',
    partido_id: null,
    autor_id: 'charlie',
    estado: 'publicada',
    destacada: false,
    auto_post: true,
    redes: [],
    created_at: parcial.publicada_en ?? '2026-08-08T18:30:00Z',
    updated_at: parcial.publicada_en ?? '2026-08-08T18:30:00Z',
    autor: AUTOR,
    ...parcial,
  }
}

export const notaDeTapa = nota({
  id: 'n-f12',
  titulo: 'Defensa y Justicia 2-1 Tiburonas',
  slug: 'defensa-y-justicia-2-1-tiburonas-fecha-n12-aldosivi-femenino-en-la-primera-b-2026',
  bajada:
    'Las Tiburonas profundizan su mal momento. Cayeron 2 a 1 frente a Defensa y Justicia, en su cuarta derrota consecutiva.',
  categoria: 'cronica',
  publicada_en: '2026-08-08T18:30:00Z',
  destacada: true,
})

export const cronicas: NotaResumen[] = [
  nota({
    id: 'n-f11',
    titulo: 'Tiburonas 0-1 All Boys',
    slug: 'tiburonas-0-1-all-boys-fecha-n11-aldosivi-femenino-en-la-primera-b-2026',
    bajada:
      'Las Tiburonas siguen en caída libre y registraron su tercera caída consecutiva. Por la próxima fecha, visitarán a Defensa y Justicia.',
    categoria: 'cronica',
    publicada_en: '2026-08-02T14:00:00Z',
  }),
  nota({
    id: 'n-f10',
    titulo: 'Defensores de Belgrano 2 – 1 Tiburonas',
    slug: 'defensores-de-belgrano-2-1-tiburonas-fecha-n10-aldosivi-femenino-en-la-primera-b-2026',
    bajada:
      'Las Tiburonas sufrieron su segunda caída consecutiva. Perdieron 2-1 frente a Defensores de Belgrano por la décima fecha de la Primera B 2026.',
    categoria: 'cronica',
    publicada_en: '2026-07-26T18:00:00Z',
  }),
  nota({
    id: 'n-f9',
    titulo: 'Rosario Central 9 – 0 Tiburonas',
    slug: 'rosario-central-9-0-tiburonas-fecha-n9-aldosivi-femenino-en-la-primera-b-2026',
    bajada:
      'En el cierre de la primera rueda de la Zona B de la Primera B 2026, las Tiburonas cayeron 9 a 0 en su visita a Rosario Central.',
    categoria: 'cronica',
    publicada_en: '2026-07-04T17:00:00Z',
  }),
  nota({
    id: 'n-f8',
    titulo: 'Tiburonas 3 – 2 Estrella del Sur',
    slug: 'tiburonas-3-2-estrella-del-sur-fecha-n8-aldosivi-femenino-en-la-primera-b-2026',
    bajada:
      'Tras dos partidos sin ganar, las Tiburonas volvieron al triunfo frente a Estrella del Sur. Ganaron 3 a 2 en el predio de Punta Mogotes.',
    categoria: 'cronica',
    publicada_en: '2026-06-26T22:00:00Z',
  }),
  nota({
    id: 'n-f7',
    titulo: 'Comunicaciones 2 – 2 Tiburonas',
    slug: 'comunicaciones-2-2-tiburonas-aldosivi-femenino-en-la-primera-b-2026',
    bajada:
      'Por la séptima fecha de la Primera B 2026, las Tiburonas empataron 2 a 2 en su visita a Comunicaciones. Así, suman 10 puntos en el campeonato.',
    categoria: 'cronica',
    publicada_en: '2026-06-07T18:30:00Z',
  }),
]

export const analisis: NotaResumen[] = [
  nota({
    id: 'n-a-central',
    titulo: 'Desafío mayúsculo para las Tiburonas en el Gigante de Arroyito',
    slug: 'desafio-mayusculo-para-las-tiburonas-en-el-gigante-de-arroyito',
    bajada:
      'Tras derrotar a Estrella del Sur, las Tiburonas cierran la primera vuelta visitando al invicto y líder Rosario Central.',
    categoria: 'analisis',
    publicada_en: '2026-07-04T15:00:00Z',
  }),
  nota({
    id: 'n-a-estrella',
    titulo: 'Un clásico moderno del ascenso pone a prueba el temple de las Tiburonas',
    slug: 'un-clasico-moderno-del-ascenso-pone-a-prueba-el-temple-de-las-tiburonas',
    bajada:
      'Las Tiburonas enfrentan a Estrella del Sur en el Predio de Punta Mogotes, por la octava fecha del campeonato de la Primera B 2026.',
    categoria: 'analisis',
    publicada_en: '2026-06-26T20:00:00Z',
  }),
  nota({
    id: 'n-a-comunicaciones',
    titulo: 'Las Tiburonas y la oportunidad de enderezar el rumbo ante Comunicaciones',
    slug: 'las-tiburonas-y-la-oportunidad-perfecta-de-enderezar-el-rumbo-ante-comunicaciones',
    bajada:
      'Las dirigidas por Marcelo Rodríguez buscan explotar la severa crisis de localía que atraviesan las Carteras para sumar tres puntos vitales.',
    categoria: 'analisis',
    publicada_en: '2026-06-07T15:00:00Z',
  }),
]

/**
 * Las caras del bloque de plantel. Van con iniciales y no con dorsales: en el
 * plantel 2026 el número cambia fecha a fecha, así que un "7" fijo sería
 * inventado. En la portada real el bloque va sin caras hasta que haya fotos.
 */
export const carasDemo = [
  { id: 'larea', fotoUrl: null, etiqueta: 'ML' },
  { id: 'nielsen', fotoUrl: null, etiqueta: 'JN' },
  { id: 'camacho', fotoUrl: null, etiqueta: 'AC' },
  { id: 'cortadi', fotoUrl: null, etiqueta: 'LC' },
  { id: 'stancato', fotoUrl: null, etiqueta: 'MS' },
  { id: 'corona', fotoUrl: null, etiqueta: 'MC' },
  { id: 'diaz', fotoUrl: null, etiqueta: 'AD' },
  { id: 'resto', fotoUrl: null, etiqueta: '+25' },
] as const

/** Los tres números reales de la temporada: plantel, goles y fechas jugadas. */
export const estadisticasDemo = [
  { valor: '32', etiqueta: 'jugadoras' },
  { valor: '23', etiqueta: 'goles' },
  { valor: '12', etiqueta: 'fechas' },
] as const
