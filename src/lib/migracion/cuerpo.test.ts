/**
 * El HTML de estos tests está copiado de `content.rendered` de
 * periodicodelfos.com, con las clases y todo: `wp-block-heading`,
 * `wp-block-image`, `wp-image-2647`, los `<br>` de la ficha del partido.
 */

import { describe, expect, it } from 'vitest'
import { htmlATipTap, sanearDocumento, seccionesDeDatosDeportivos } from '@/lib/migracion/cuerpo'
import type { ResolverImagen } from '@/lib/migracion/cuerpo'
import { parsearDocumento } from '@/lib/tiptap/esquema'
import type { NodoTipTap } from '@/types'

/** Acepta toda imagen y la deja con el `src` y el `alt` que ya traía. */
const aceptarTodo: ResolverImagen = (imagen) =>
  imagen.alt === ''
    ? null
    : {
        src: 'https://proyecto.supabase.co/storage/v1/object/public/media/wp/a.jpg',
        alt: imagen.alt,
        epigrafe: imagen.epigrafe === '' ? null : imagen.epigrafe,
        credito: null,
      }

const rechazarTodo: ResolverImagen = () => null

function convertir(html: string, resolverImagen: ResolverImagen = aceptarTodo) {
  return htmlATipTap(html, { resolverImagen })
}

function tipos(nodos: readonly NodoTipTap[] | undefined): string[] {
  return (nodos ?? []).map((nodo) => nodo.type)
}

describe('htmlATipTap', () => {
  it('convierte los bloques que usa una crónica', () => {
    const { documento } = convertir(
      '<h2 class="wp-block-heading"><strong>FICHA DEL PARTIDO</strong></h2>' +
        '<p>Primera B 2026 – Zona B<br>Fecha N°12 – sábado 8 de agosto</p>' +
        '<ul class="wp-block-list"><li>1 &#8211; Katja Velardez</li><li>2 &#8211; Victoria Mosquera</li></ul>' +
        '<blockquote><p>Fue un partido durísimo.</p></blockquote>' +
        '<hr class="wp-block-separator" />',
    )

    expect(tipos(documento.content)).toEqual([
      'heading',
      'paragraph',
      'bulletList',
      'blockquote',
      'horizontalRule',
    ])
  })

  it('resuelve las entidades y respeta los saltos de línea de la ficha', () => {
    const { documento } = convertir('<p>Aldosivi 2 &#8211; 1 Tigre<br>Zona B</p>')

    expect(documento.content?.[0]).toEqual({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Aldosivi 2 – 1 Tigre' },
        { type: 'hardBreak' },
        { type: 'text', text: 'Zona B' },
      ],
    })
  })

  it('lee el <figure> entero: imagen, alt y epígrafe', () => {
    const { documento } = convertir(
      '<figure class="wp-block-image size-large">' +
        '<img src="https://periodicodelfos.com/wp-content/uploads/2026/08/foto-1024x576.jpg" alt="El once inicial" class="wp-image-2647" />' +
        '<figcaption class="wp-element-caption"><em>Once titular. Foto: Prensa Aldosivi.</em></figcaption>' +
        '</figure>',
    )

    expect(documento.content).toEqual([
      {
        type: 'imagen',
        attrs: {
          src: 'https://proyecto.supabase.co/storage/v1/object/public/media/wp/a.jpg',
          alt: 'El once inicial',
          epigrafe: 'Once titular. Foto: Prensa Aldosivi.',
          credito: null,
        },
      },
    ])
  })

  it('no deja el epígrafe suelto como párrafo cuando descarta la imagen', () => {
    // Sin el nodo `imagen` como atom, ProseMirror tiraba el <img> y dejaba el
    // <figcaption> convertido en un párrafo huérfano abajo de la nota.
    const { documento, descartados } = convertir(
      '<p>Antes.</p>' +
        '<figure class="wp-block-image"><img src="https://x/a.jpg" alt="" /><figcaption>Un pie</figcaption></figure>' +
        '<p>Después.</p>',
      rechazarTodo,
    )

    expect(tipos(documento.content)).toEqual(['paragraph', 'paragraph'])
    expect(descartados).toEqual({ 'imagen-descartada': 1 })
  })

  it('descarta la imagen que no pasaría el filtro del renderer', () => {
    const { documento, descartados } = convertir(
      '<img src="javascript:alert(1)" alt="Un ataque" />',
      (imagen) => ({ src: imagen.src, alt: imagen.alt, epigrafe: null, credito: null }),
    )

    expect(documento.content).toEqual([])
    expect(descartados).toEqual({ 'imagen-invalida': 1 })
  })

  it('saca la negrita de los subtítulos', () => {
    // WordPress escribía todos los <h2> como <h2><strong>…</strong></h2>.
    const { documento } = convertir('<h2 class="wp-block-heading"><strong>Incidencias</strong></h2>')

    expect(documento.content?.[0]).toEqual({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Incidencias' }],
    })
  })

  it('acota los encabezados a h2 y h3', () => {
    const { documento } = convertir('<h1>Uno</h1><h4>Cuatro</h4><h6>Seis</h6>')

    expect((documento.content ?? []).map((nodo) => nodo.attrs?.level)).toEqual([2, 3, 3])
  })

  it('tira los párrafos que WordPress deja vacíos', () => {
    const { documento } = convertir('<p>&nbsp;</p><p>  </p><p><br></p><p>Con texto.</p>')

    expect(tipos(documento.content)).toEqual(['paragraph'])
  })

  it('conserva el texto de las marcas que el renderer no dibuja', () => {
    const { documento } = convertir('<p><s>tachado</s> y <u>subrayado</u></p>')

    expect(documento.content?.[0]?.content).toEqual([
      { type: 'text', text: 'tachado' },
      { type: 'text', text: ' y ' },
      { type: 'text', text: 'subrayado' },
    ])
  })

  it('deja del link sólo el href', () => {
    // StarterKit agrega `target`, `rel`, `class` y `title`; el renderer lee el
    // `href` y nada más.
    const { documento } = convertir(
      '<p><a href="https://afa.com.ar" target="_blank" rel="nofollow" class="ext">AFA</a></p>',
    )

    expect(documento.content?.[0]?.content).toEqual([
      { type: 'text', text: 'AFA', marks: [{ type: 'link', attrs: { href: 'https://afa.com.ar' } }] },
    ])
  })

  it('no deja pasar un esquema prohibido, ni siquiera si TipTap lo dejara', () => {
    // TipTap ya descarta `javascript:` al parsear, así que del HTML sale texto
    // suelto. La prueba de verdad es la de abajo, contra el saneador: es el
    // único filtro que también corre sobre un JSON que no vino del parser.
    const { documento } = convertir('<p>antes <a href="javascript:alert(1)">esto no</a></p>')
    expect(documento.content?.[0]?.content).toEqual([{ type: 'text', text: 'antes esto no' }])

    const saneado = sanearDocumento(
      {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'esto no',
                marks: [{ type: 'link', attrs: { href: 'java\nscript:alert(1)' } }],
              },
            ],
          },
        ],
      },
      { resolverImagen: aceptarTodo },
    )

    expect(saneado.documento.content?.[0]?.content).toEqual([{ type: 'text', text: 'esto no' }])
  })

  it('anida las marcas en el orden que espera el renderer', () => {
    const { documento } = convertir('<p><a href="/x"><strong><em>fuerte</em></strong></a></p>')

    expect(documento.content?.[0]?.content?.[0]?.marks?.map((m) => m.type)).toEqual([
      'italic',
      'bold',
      'link',
    ])
  })

  it('baja el bloque de código a un párrafo con la marca code', () => {
    const { documento, descartados } = convertir('<pre><code>const a = 1</code></pre>')

    expect(documento.content?.[0]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'const a = 1', marks: [{ type: 'code' }] }],
    })
    expect(descartados).toEqual({ codeBlock: 1 })
  })

  it('descarta lo que no sabe dibujar sin llevarse el resto', () => {
    const { documento } = convertir(
      '<p>Antes.</p><iframe src="https://youtube.com/embed/x"></iframe><p>Después.</p>',
    )

    expect(tipos(documento.content)).toEqual(['paragraph', 'paragraph'])
  })

  it('produce un documento que el renderer acepta', () => {
    const { documento } = convertir(
      '<h2><strong>Ficha</strong></h2><p>Texto con <a href="/x">link</a>.</p>' +
        '<ul><li>uno</li></ul><ol start="3"><li>tres</li></ol>',
    )

    expect(parsearDocumento(documento)).not.toBeNull()
  })

  it('devuelve un documento vacío y no explota si no hay nada que convertir', () => {
    expect(convertir('').documento).toEqual({ type: 'doc', content: [] })
  })
})

describe('sanearDocumento', () => {
  it('sobrevive a algo que no es un documento', () => {
    expect(sanearDocumento(null, { resolverImagen: aceptarTodo }).documento).toEqual({
      type: 'doc',
      content: [],
    })
    expect(sanearDocumento({ type: 'doc' }, { resolverImagen: aceptarTodo }).documento).toEqual({
      type: 'doc',
      content: [],
    })
  })
})

describe('seccionesDeDatosDeportivos', () => {
  it('detecta la ficha del partido tipeada a mano', () => {
    const { documento } = convertir(
      '<h2><strong>FICHA DEL PARTIDO</strong></h2><p>x</p>' +
        '<h2><strong>¿Cómo formó Aldosivi ante All Boys?</strong></h2><p>y</p>' +
        '<h2><strong>Suplentes de Aldosivi</strong></h2><p>z</p>' +
        '<h2><strong>El análisis del partido</strong></h2><p>w</p>',
    )

    expect(seccionesDeDatosDeportivos(documento)).toEqual([
      'FICHA DEL PARTIDO',
      '¿Cómo formó Aldosivi ante All Boys?',
      'Suplentes de Aldosivi',
    ])
  })

  it('no marca una nota que sólo tiene prosa', () => {
    const { documento } = convertir('<h2>El envión de las Tiburonas</h2><p>Texto.</p>')

    expect(seccionesDeDatosDeportivos(documento)).toEqual([])
  })
})
