/**
 * El HTML del cuerpo → JSON de TipTap, podado al contrato del renderer.
 *
 * Son dos pasos y ninguno se puede saltear:
 *
 * 1. `generateJSON()` de `@tiptap/html/server` parsea el HTML con un DOM de
 *    verdad. Va con el vocabulario amplio de `extensionesDeMigracion()`: es
 *    mejor que el parser tenga dónde poner cada cosa y podar después que perder
 *    un párrafo porque no había nodo que lo aceptara.
 * 2. `sanearDocumento()` recorre el resultado y deja **sólo** lo que
 *    `render.tsx` sabe dibujar. Lo que sobra —`strike`, `underline`,
 *    `codeBlock`, atributos de link que nadie lee— se descarta acá y no en el
 *    servidor cada vez que alguien abre la nota.
 *
 * El renderer ya descarta lo que no entiende, así que este paso no es una
 * defensa: es no guardarse basura en `notas.cuerpo` durante los próximos diez
 * años. Y los dos usan las mismas funciones de `lib/tiptap/esquema.ts`
 * —`hrefSeguro`, `atributosImagen`— para que sea imposible migrar una imagen o
 * un link que después la nota no muestre.
 *
 * Ojo con el import: en Node hay que pedir `@tiptap/html/server`. El
 * `@tiptap/html` pelado tira "generateJSON can only be used in a browser
 * environment".
 */

import { generateJSON } from '@tiptap/html/server'
import { extensionesDeMigracion, type ImagenCruda } from '@/lib/migracion/extensiones'
import { atributosImagen, hrefSeguro, inicioDeLista } from '@/lib/tiptap/esquema'
import type { AtributosImagen } from '@/lib/tiptap/esquema'
import type { DocumentoTipTap, NodoTipTap } from '@/types'

/**
 * Resuelve una imagen del HTML a sus atributos finales, o la descarta.
 *
 * Devolver `null` saca la imagen del documento. Es lo que pasa cuando no hay
 * `alt`: la regla no negociable 4 dice que ninguna nota se publica con `alt`
 * vacío, y la base lo repite en el constraint `alt_requerido`. Quien llama se
 * anota el slug para completarlo a mano y volver a correr.
 */
export type ResolverImagen = (imagen: ImagenCruda) => AtributosImagen | null

export interface OpcionesCuerpo {
  resolverImagen: ResolverImagen
}

export interface ResultadoCuerpo {
  documento: DocumentoTipTap
  /** Qué se tiró y cuántas veces, por tipo de nodo. Va al informe. */
  descartados: Record<string, number>
}

/** Marcas que el renderer dibuja. `link` va aparte: hay que filtrar el `href`. */
const MARCAS_PERMITIDAS: readonly string[] = ['code', 'italic', 'bold']

interface Contexto {
  opciones: OpcionesCuerpo
  descartados: Map<string, number>
  /** Adentro de un `heading` la negrita sobra: el título ya es negrita. */
  enTitulo: boolean
}

function descartar(contexto: Contexto, tipo: string): void {
  contexto.descartados.set(tipo, (contexto.descartados.get(tipo) ?? 0) + 1)
}

/**
 * Las marcas de un nodo de texto, en el orden en que el renderer las anida.
 *
 * WordPress trae `strike` y `underline` de la época en que el editor los tenía;
 * el renderer no los dibuja, así que la marca se cae y el texto queda. Del link
 * sobrevive sólo el `href` —StarterKit agrega `target`, `rel`, `class` y
 * `title`— y sólo si pasa `hrefSeguro()`.
 */
function sanearMarcas(marcas: NodoTipTap['marks'], enTitulo: boolean): NodoTipTap['marks'] {
  if (!marcas?.length) return undefined

  const salida: NonNullable<NodoTipTap['marks']> = []

  for (const tipo of MARCAS_PERMITIDAS) {
    if (tipo === 'bold' && enTitulo) continue
    if (marcas.some((marca) => marca.type === tipo)) salida.push({ type: tipo })
  }

  const link = marcas.find((marca) => marca.type === 'link')
  if (link) {
    const href = hrefSeguro(link.attrs?.href)
    // Un href que no pasa el filtro deja el texto sin link, igual que en el
    // renderer: se pierde el destino, nunca la frase.
    if (href) salida.push({ type: 'link', attrs: { href } })
  }

  return salida.length > 0 ? salida : undefined
}

/** `true` si hay algo que valga la pena dibujar. Un `<br>` solo no cuenta. */
function tieneAlgoVisible(nodos: readonly NodoTipTap[]): boolean {
  return nodos.some((nodo) =>
    nodo.type === 'text' ? (nodo.text ?? '').trim() !== '' : nodo.type !== 'hardBreak',
  )
}

function sanearHijos(nodos: NodoTipTap[] | undefined, contexto: Contexto): NodoTipTap[] {
  if (!nodos) return []
  return nodos.flatMap((nodo) => sanearNodo(nodo, contexto))
}

/** Un bloque con hijos: se descarta entero si queda vacío. */
function bloque(nodo: NodoTipTap, contexto: Contexto, tipo: string): NodoTipTap[] {
  const content = sanearHijos(nodo.content, contexto)
  if (!tieneAlgoVisible(content)) return []
  return [{ type: tipo, content }]
}

function sanearNodo(nodo: NodoTipTap, contexto: Contexto): NodoTipTap[] {
  switch (nodo.type) {
    case 'text': {
      if (typeof nodo.text !== 'string' || nodo.text === '') return []
      const marks = sanearMarcas(nodo.marks, contexto.enTitulo)
      return [marks ? { type: 'text', text: nodo.text, marks } : { type: 'text', text: nodo.text }]
    }

    case 'paragraph':
      return bloque(nodo, contexto, 'paragraph')

    case 'heading': {
      // El `h1` de la página es el título de la nota, así que el cuerpo arranca
      // en `h2`; WordPress usaba `h2` para todo y algún `h4` suelto. Lo que pase
      // de 3 se pega a 3 en vez de perderse: es contenido real.
      const nivelCrudo = (nodo.attrs as { level?: unknown } | undefined)?.level
      const level = typeof nivelCrudo === 'number' && nivelCrudo >= 3 ? 3 : 2

      const content = sanearHijos(nodo.content, { ...contexto, enTitulo: true })
      if (!tieneAlgoVisible(content)) return []
      return [{ type: 'heading', attrs: { level }, content }]
    }

    case 'bulletList':
    case 'blockquote':
      return bloque(nodo, contexto, nodo.type)

    case 'orderedList': {
      const content = sanearHijos(nodo.content, contexto)
      if (!tieneAlgoVisible(content)) return []
      const start = inicioDeLista(nodo.attrs)
      return [
        start === undefined
          ? { type: 'orderedList', content }
          : { type: 'orderedList', attrs: { start }, content },
      ]
    }

    case 'listItem':
      return bloque(nodo, contexto, 'listItem')

    case 'horizontalRule':
    case 'hardBreak':
      return [{ type: nodo.type }]

    case 'imagen': {
      const cruda = nodo.attrs as unknown as ImagenCruda
      const resuelta = contexto.opciones.resolverImagen(cruda)
      if (!resuelta) {
        // El motivo lo sabe quien resuelve —falta el `alt`, o la foto ya está
        // arriba como portada— y lo anota en las advertencias de la nota. Acá
        // sólo se cuenta.
        descartar(contexto, 'imagen-descartada')
        return []
      }

      // La misma puerta que usa el renderer. Si no pasa acá, no se dibujaría.
      const validada = atributosImagen(resuelta)
      if (!validada) {
        descartar(contexto, 'imagen-invalida')
        return []
      }

      return [
        {
          type: 'imagen',
          attrs: {
            src: validada.src,
            alt: validada.alt,
            epigrafe: validada.epigrafe,
            credito: validada.credito,
          },
        },
      ]
    }

    case 'codeBlock': {
      // El renderer no dibuja bloques de código —no hay uno solo en 70 notas de
      // fútbol— pero tirar el nodo tiraría el texto. Baja a párrafo con la
      // marca `code`, que sí sabe dibujar.
      const content = sanearHijos(nodo.content, contexto).map((hijo) =>
        hijo.type === 'text' ? { ...hijo, marks: [{ type: 'code' }] } : hijo,
      )
      if (!tieneAlgoVisible(content)) return []
      descartar(contexto, 'codeBlock')
      return [{ type: 'paragraph', content }]
    }

    default:
      descartar(contexto, nodo.type)
      return []
  }
}

/** Poda un documento de TipTap hasta dejar sólo lo que `render.tsx` dibuja. */
export function sanearDocumento(
  crudo: unknown,
  opciones: OpcionesCuerpo,
): ResultadoCuerpo {
  const contexto: Contexto = {
    opciones,
    descartados: new Map(),
    enTitulo: false,
  }

  const content = Array.isArray((crudo as DocumentoTipTap | undefined)?.content)
    ? sanearHijos((crudo as DocumentoTipTap).content, contexto)
    : []

  return {
    documento: { type: 'doc', content },
    descartados: Object.fromEntries(contexto.descartados),
  }
}

/** El HTML de una nota de WordPress, ya convertido y podado. */
export function htmlATipTap(html: string, opciones: OpcionesCuerpo): ResultadoCuerpo {
  return sanearDocumento(generateJSON(html, extensionesDeMigracion()), opciones)
}

/**
 * Los subtítulos que delatan datos deportivos escritos a mano en el cuerpo.
 *
 * La regla no negociable 1 del blueprint —"ningún dato deportivo se escribe a
 * mano dentro del texto de una nota"— es el proyecto entero, y las 53 crónicas
 * viejas la violan todas: la formación, los goles y las incidencias están
 * tipeadas en el HTML. La migración **no las toca**, porque convertirlas en
 * filas de `partidos` y `eventos` a fuerza de regex es exactamente el tipo de
 * parseo que el blueprint descarta (sección 5, "Datos deportivos históricos":
 * se cargan a mano desde el admin).
 *
 * Lo que sí hace es dejar la lista de cuáles, para que cargar los partidos a
 * mano y después limpiar esas secciones sea una tarea con un largo conocido y
 * no una búsqueda a ojo entre 70 notas.
 */
const SUBTITULO_DE_DATOS =
  /ficha del partido|c[oó]mo form[oó]|suplentes de|incidencias|formaci[oó]n(?:es)?|s[ií]ntesis/iu

export function seccionesDeDatosDeportivos(documento: DocumentoTipTap): string[] {
  const encontradas: string[] = []

  for (const nodo of documento.content ?? []) {
    if (nodo.type !== 'heading') continue
    const texto = (nodo.content ?? [])
      .map((hijo) => hijo.text ?? '')
      .join('')
      .trim()
    if (texto !== '' && SUBTITULO_DE_DATOS.test(texto)) encontradas.push(texto)
  }

  return encontradas
}
