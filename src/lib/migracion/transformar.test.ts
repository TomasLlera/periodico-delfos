/**
 * La migración entera, de punta a punta, sin red y sin base.
 *
 * El volcado de acá abajo es una réplica reducida del de periodicodelfos.com:
 * una crónica con la imagen destacada repetida en el cuerpo y sin `alt`, y un
 * análisis con bajada escrita a mano.
 */

import { describe, expect, it } from 'vitest'
import { transformarVolcado } from '@/lib/migracion/transformar'
import type { OpcionesTransformar } from '@/lib/migracion/transformar'
import type { VolcadoWP } from '@/lib/migracion/tipos'

const OPCIONES: OpcionesTransformar = {
  urlSupabase: 'https://abc.supabase.co',
  bajadas: {},
  alts: {},
  autorSlug: 'charlie-redondo',
}

const VOLCADO: VolcadoWP = {
  categorias: [
    { id: 44, slug: 'cronicas', name: 'Crónicas', parent: 25, link: 'https://periodicodelfos.com/category/futbol-femenino/cronicas/' },
    { id: 48, slug: 'analisis', name: 'Análisis', parent: 25, link: 'https://periodicodelfos.com/category/futbol-femenino/analisis/' },
    { id: 25, slug: 'futbol-femenino', name: 'Fútbol Femenino', parent: 0, link: 'https://periodicodelfos.com/category/futbol-femenino/' },
  ],
  autores: [
    { id: 1, slug: 'redondocarlosrogeliogmail-com', name: 'Charlie Redondo', description: '', link: 'https://periodicodelfos.com/author/redondocarlosrogeliogmail-com/' },
  ],
  medios: [
    {
      id: 2647,
      slug: 'once-titular',
      source_url: 'https://periodicodelfos.com/wp-content/uploads/2026/08/IMG-WA0043.jpg',
      mime_type: 'image/jpeg',
      alt_text: '',
      caption: { rendered: '<p>Once titular. Foto: Prensa Aldosivi.</p>' },
    },
    {
      id: 3000,
      slug: 'entrenamiento',
      source_url: 'https://periodicodelfos.com/wp-content/uploads/2026/07/entrenamiento.jpg',
      mime_type: 'image/jpeg',
      alt_text: 'Las jugadoras entrenan en el Puerto',
      caption: { rendered: '' },
    },
  ],
  posts: [
    {
      id: 2645,
      slug: 'defensa-y-justicia-2-1-tiburonas-fecha-n12-aldosivi-femenino-en-la-primera-b-2026',
      link: 'https://periodicodelfos.com/defensa-y-justicia-2-1-tiburonas-fecha-n12-aldosivi-femenino-en-la-primera-b-2026/',
      status: 'publish',
      date_gmt: '2026-08-08T18:30:00',
      modified_gmt: '2026-08-08T22:57:38',
      title: {
        rendered:
          'Defensa y Justicia 2-1 Tiburonas: Fecha N°12 &#8211; Aldosivi Femenino en la Primera B 2026',
      },
      content: {
        rendered:
          '<h2 class="wp-block-heading"><strong>FICHA DEL PARTIDO</strong></h2>' +
          '<p>Primera B 2026 – Zona B<br>Defensa y Justicia 2 &#8211; Aldosivi 1</p>' +
          '<figure class="wp-block-image"><img src="https://periodicodelfos.com/wp-content/uploads/2026/08/IMG-WA0043-1024x576.jpg" alt="" class="wp-image-2647" /><figcaption>Once titular. Foto: Prensa Aldosivi.</figcaption></figure>' +
          '<h2 class="wp-block-heading"><strong>¿Cómo formó Aldosivi ante Defensa y Justicia?</strong></h2>' +
          '<ul class="wp-block-list"><li>1 &#8211; Katja Velardez</li></ul>',
      },
      excerpt: {
        rendered:
          '<p>Las Tiburonas profundizan su mal momento. Cayeron 2 a 1 frente a Defensa y Justicia.</p>\n',
      },
      author: 1,
      featured_media: 2647,
      categories: [44, 25],
    },
    {
      id: 2600,
      slug: 'desafio-mayusculo-para-las-tiburonas',
      link: 'https://periodicodelfos.com/desafio-mayusculo-para-las-tiburonas/',
      status: 'publish',
      date_gmt: '2026-07-30T12:00:00',
      modified_gmt: '2026-07-30T12:00:00',
      title: { rendered: 'Desafío mayúsculo para las Tiburonas en el Gigante de Arroyito' },
      content: {
        rendered:
          '<p>El sábado visitan a Rosario Central.</p>' +
          '<figure class="wp-block-image"><img src="https://periodicodelfos.com/wp-content/uploads/2026/07/entrenamiento.jpg" alt="" class="wp-image-3000" /></figure>',
      },
      excerpt: { rendered: '<p>El sábado visitan a Rosario Central. Y</p>' },
      author: 1,
      featured_media: 0,
      categories: [48, 25],
    },
  ],
}

describe('transformarVolcado', () => {
  const resultado = transformarVolcado(VOLCADO, OPCIONES)
  const [cronica, analisis] = resultado.notas

  it('preserva el slug viejo', () => {
    expect(cronica?.slug).toBe(VOLCADO.posts[0]?.slug)
  })

  it('limpia el título y guarda fecha y temporada aparte', () => {
    expect(cronica?.titulo).toBe('Defensa y Justicia 2-1 Tiburonas')
    expect(cronica?.fechaNumero).toBe(12)
    expect(cronica?.temporada?.slug).toBe('primera-b-2026')
  })

  it('mapea la categoría ignorando la genérica', () => {
    expect(cronica?.categoria).toBe('cronica')
    expect(analisis?.categoria).toBe('analisis')
    expect(resultado.categoriasSinMapear).toEqual([])
  })

  it('usa el extracto cuando está escrito a mano', () => {
    expect(cronica?.bajada).toBe(
      'Las Tiburonas profundizan su mal momento. Cayeron 2 a 1 frente a Defensa y Justicia.',
    )
    expect(cronica?.listaParaEscribir).toBe(true)
  })

  it('deja la bajada vacía y avisa cuando el extracto está truncado', () => {
    expect(analisis?.bajada).toBe('')
    expect(analisis?.listaParaEscribir).toBe(false)
    expect(analisis?.advertencias.map((a) => a.tipo)).toContain('bajada-faltante')
  })

  it('prefiere la bajada escrita a mano por sobre la de WordPress', () => {
    const conBajadas = transformarVolcado(VOLCADO, {
      ...OPCIONES,
      bajadas: { 'desafio-mayusculo-para-las-tiburonas': 'Un viaje al Gigante de Arroyito.' },
    })

    expect(conBajadas.notas[1]?.bajada).toBe('Un viaje al Gigante de Arroyito.')
    expect(conBajadas.notas[1]?.listaParaEscribir).toBe(true)
  })

  it('no publica una nota con el alt pendiente', () => {
    expect(cronica?.estado).toBe('borrador')
    expect(cronica?.portada).toBeNull()
    expect(cronica?.advertencias.map((a) => a.tipo)).toContain('alt-faltante')
  })

  it('sube igual la imagen sin alt, para que esté cuando se escriba', () => {
    expect(resultado.imagenes.map((imagen) => imagen.ruta)).toContain('wp/2026/08/img-wa0043.jpg')
  })

  it('publica cuando el alt está escrito a mano', () => {
    const conAlts = transformarVolcado(VOLCADO, {
      ...OPCIONES,
      alts: { 'wp/2026/08/img-wa0043.jpg': 'El once titular de las Tiburonas' },
      bajadas: { 'desafio-mayusculo-para-las-tiburonas': 'Un viaje al Gigante.' },
    })

    const nota = conAlts.notas[0]
    expect(nota?.estado).toBe('publicada')
    expect(nota?.portada?.alt).toBe('El once titular de las Tiburonas')
    expect(nota?.portada?.credito).toBe('Prensa Aldosivi')
    expect(nota?.portada?.epigrafe).toBe('Once titular')
  })

  it('no repite la imagen destacada dentro del cuerpo', () => {
    // WordPress la pone como portada y además como primer <figure> del cuerpo.
    expect(cronica?.advertencias.map((a) => a.tipo)).toContain('portada-repetida-en-el-cuerpo')
    expect(cronica?.cuerpo.content?.some((nodo) => nodo.type === 'imagen')).toBe(false)
  })

  it('sube al bucket la variante original, no la escalada del cuerpo', () => {
    expect(resultado.imagenes.map((i) => i.origen)).not.toContain(
      'https://periodicodelfos.com/wp-content/uploads/2026/08/IMG-WA0043-1024x576.jpg',
    )
  })

  it('toma el alt de la biblioteca de medios cuando está cargado', () => {
    const delCuerpo = analisis?.imagenes[0]
    expect(delCuerpo?.alt).toBe('Las jugadoras entrenan en el Puerto')
    expect(analisis?.cuerpo.content?.at(-1)).toEqual({
      type: 'imagen',
      attrs: {
        src: 'https://abc.supabase.co/storage/v1/object/public/media/wp/2026/07/entrenamiento.jpg',
        alt: 'Las jugadoras entrenan en el Puerto',
        epigrafe: null,
        credito: null,
      },
    })
  })

  it('marca las notas que traen la ficha del partido tipeada a mano', () => {
    expect(
      cronica?.advertencias.find((a) => a.tipo === 'datos-deportivos-en-el-cuerpo')?.detalle,
    ).toBe('FICHA DEL PARTIDO · ¿Cómo formó Aldosivi ante Defensa y Justicia?')
    expect(analisis?.advertencias.map((a) => a.tipo)).not.toContain('datos-deportivos-en-el-cuerpo')
  })

  it('convierte date_gmt a UTC de verdad', () => {
    expect(cronica?.publicadaEn).toBe('2026-08-08T18:30:00.000Z')
  })

  it('no repite una imagen usada por dos notas', () => {
    const rutas = resultado.imagenes.map((imagen) => imagen.ruta)
    expect(new Set(rutas).size).toBe(rutas.length)
  })

  it('atribuye las notas al autor configurado', () => {
    expect(resultado.notas.every((nota) => nota.autorSlug === 'charlie-redondo')).toBe(true)
  })
})
