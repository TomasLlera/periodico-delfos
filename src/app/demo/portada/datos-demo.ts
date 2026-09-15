import type { NotaResumen } from '@/types'

/**
 * Datos falsos para mirar la portada sin proyecto de Supabase.
 *
 * **Viven acá y no en los componentes ni en `/`.** Es la misma separación que
 * estrenó la página de nota: los componentes no saben de dónde salen sus datos,
 * y lo inventado queda encerrado en una ruta que no se indexa. Este archivo se
 * borra —junto con la página de demo— cuando la migración cargue notas reales.
 *
 * Los resultados que se nombran en los títulos son los del boceto, y sólo
 * viven en esta ruta: la portada real no muestra ningún dato deportivo hasta
 * que esté la base (regla no negociable 1).
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
    created_at: parcial.publicada_en ?? '2026-09-15T12:00:00Z',
    updated_at: parcial.publicada_en ?? '2026-09-15T12:00:00Z',
    autor: AUTOR,
    ...parcial,
  }
}

export const notaDeTapa = nota({
  id: 'tapa',
  titulo: 'Las Tiburonas lo dieron vuelta en diez minutos',
  slug: 'tiburonas-lo-dieron-vuelta',
  bajada:
    'Perdían 0-1 desde el primer tiempo y parecía otra tarde amarga en la Cancha 2. Dos goles en el tramo final, uno de cabeza y otro de pelota parada, cambiaron el ánimo del equipo y la tabla.',
  categoria: 'cronica',
  publicada_en: '2026-09-15T09:00:00Z',
  destacada: true,
})

export const cronicas: NotaResumen[] = [
  nota({
    id: 'c1',
    titulo: 'Empate con sabor a poco frente a Excursionistas',
    slug: 'empate-excursionistas',
    bajada:
      'El equipo dominó la pelota pero le faltó puntería. Las claves de un 0-0 que dejó preguntas sobre la delantera.',
    categoria: 'cronica',
    publicada_en: '2026-09-12T20:00:00Z',
  }),
  nota({
    id: 'c2',
    titulo: 'Goleada en Rosario y liderazgo momentáneo',
    slug: 'goleada-en-rosario',
    bajada: 'Cuatro goles de visitante y una defensa que casi no sufrió.',
    categoria: 'cronica',
    publicada_en: '2026-09-05T20:00:00Z',
  }),
  nota({
    id: 'c3',
    titulo: 'Derrota ajustada en el clásico',
    slug: 'derrota-en-el-clasico',
    bajada: 'Un gol en contra decidió un partido parejo que se jugó con lluvia.',
    categoria: 'cronica',
    publicada_en: '2026-08-29T20:00:00Z',
  }),
  nota({
    id: 'c4',
    titulo: 'Debut de la arquera juvenil con valla invicta',
    slug: 'debut-arquera-juvenil',
    bajada: 'Diecisiete años y tres atajadas clave en su primer partido oficial.',
    categoria: 'cronica',
    publicada_en: '2026-08-22T20:00:00Z',
  }),
  nota({
    id: 'c5',
    titulo: 'Victoria de local con dos goles de la capitana',
    slug: 'victoria-de-local',
    bajada: 'Una tarde de esas que se recuerdan: doblete y ovación.',
    categoria: 'cronica',
    publicada_en: '2026-08-15T20:00:00Z',
  }),
]

export const analisis: NotaResumen[] = [
  nota({
    id: 'a1',
    titulo: 'Por qué Aldosivi convierte más en los últimos 15 minutos',
    slug: 'goles-ultimos-quince',
    bajada:
      'Siete de los diecinueve goles del torneo llegaron después del minuto 75. Los números del físico y del banco.',
    categoria: 'analisis',
    publicada_en: '2026-09-10T12:00:00Z',
  }),
  nota({
    id: 'a2',
    titulo: 'El cambio al 4-3-3 y lo que ganó el mediocampo',
    slug: 'cambio-al-433',
    bajada: 'Desde la fecha 6 el equipo presiona más alto y recupera antes.',
    categoria: 'analisis',
    publicada_en: '2026-09-03T12:00:00Z',
  }),
  nota({
    id: 'a3',
    titulo: 'Qué necesita el equipo para meterse en el reducido',
    slug: 'cuentas-del-reducido',
    bajada: 'Faltan seis fechas y hay tres equipos en cuatro puntos.',
    categoria: 'analisis',
    publicada_en: '2026-08-27T12:00:00Z',
  }),
]

/** Sólo para la demo: en la portada real el bloque va sin números. */
export const carasDemo = [
  { id: '1', fotoUrl: null, etiqueta: '1' },
  { id: '4', fotoUrl: null, etiqueta: '4' },
  { id: '7', fotoUrl: null, etiqueta: '7' },
  { id: '9', fotoUrl: null, etiqueta: '9' },
  { id: '10', fotoUrl: null, etiqueta: '10' },
  { id: '11', fotoUrl: null, etiqueta: '11' },
  { id: '14', fotoUrl: null, etiqueta: '14' },
  { id: 'resto', fotoUrl: null, etiqueta: '+16' },
] as const

export const estadisticasDemo = [
  { valor: '24', etiqueta: 'jugadoras' },
  { valor: '19', etiqueta: 'goles' },
  { valor: '3°', etiqueta: 'en la tabla' },
] as const
