/**
 * Renderer del cuerpo de una nota: JSON de TipTap → elementos de React.
 *
 * Se ejecuta en un Server Component y no manda un byte de JavaScript al
 * cliente. No usa `dangerouslySetInnerHTML` ni `generateHTML()` de
 * `@tiptap/html`: recorrer el JSON y devolver elementos es lo único que permite
 * que un nodo del documento —`planilla`— sea un componente React de verdad, con
 * sus props tipadas, en vez de una cadena de HTML. De paso, no hay ningún punto
 * del pipeline donde una nota pueda inyectar markup arbitrario en la página.
 *
 * El documento viene de la base y no se confía en él: `parsearDocumento()`
 * valida la forma antes de recorrerlo y cada nodo valida sus atributos al
 * dibujarse. Lo que no se entiende se descarta en silencio; ningún dato mal
 * cargado deja la nota en blanco.
 */

import { Fragment, type ReactNode } from 'react'
import { ImagenResponsive } from '@/components/content/ImagenResponsive'
import { PlanillaPartido } from '@/components/partido/PlanillaPartido'
import {
  PROFUNDIDAD_MAXIMA,
  atributosImagen,
  esExterno,
  hrefDeMarcas,
  inicioDeLista,
  nivelDeTitulo,
  parsearDocumento,
  partidoIdDeNodo,
  tieneMarca,
} from '@/lib/tiptap/esquema'
import type { NodoTipTap, PartidoCompleto } from '@/types'

/**
 * Partidos que la página precargó, indexados por id.
 *
 * El renderer no consulta la base. El nodo `planilla` sólo guarda un
 * `partidoId`; resolverlo es responsabilidad de la página, que ya sabe hacer
 * una sola consulta por todos los ids en lugar de una por nodo.
 *
 * Es un `Map` y no un objeto plano a propósito: el `partidoId` sale de un JSON
 * que no controlamos, y un `Record` respondería a claves como `constructor` o
 * `toString` con algo que no es un partido.
 */
export type MapaDePartidos = ReadonlyMap<string, PartidoCompleto>

/** Arma el mapa que espera `<CuerpoTipTap />` a partir de los partidos ya leídos. */
export function mapaDePartidos(partidos: readonly PartidoCompleto[]): MapaDePartidos {
  return new Map(partidos.map((partido) => [partido.id, partido]))
}

interface Contexto {
  partidos: MapaDePartidos
  /** Nivel del encabezado más alto que puede usar el cuerpo. */
  nivelBase: 2 | 3
}

interface Props {
  /** `notas.cuerpo` tal como sale de la base. Sin tipar: no es confiable. */
  cuerpo: unknown
  /** Partidos precargados para los nodos `planilla`. */
  partidos?: MapaDePartidos
  /**
   * Nivel del encabezado más alto del cuerpo. En `/nota/[slug]` el `h1` es el
   * título, así que los subtítulos arrancan en `h2` (el valor por omisión).
   */
  nivelBase?: 2 | 3
  className?: string
}

/**
 * El cuerpo de una nota, envuelto en `.prose-nota`.
 *
 * La clase va acá adentro y no en quien lo llama: la medida de 68ch es la regla
 * no negociable número 2 del blueprint y no puede depender de que la página se
 * acuerde de aplicarla.
 */
export function CuerpoTipTap({
  cuerpo,
  partidos = new Map(),
  nivelBase = 2,
  className = '',
}: Props) {
  const documento = parsearDocumento(cuerpo)

  if (!documento) {
    // Sale por los logs del servidor, no por la página. Que un cuerpo no valide
    // es un bug de datos y hay que poder verlo, pero el lector no tiene por qué.
    if (process.env.NODE_ENV !== 'production') {
      console.error('[tiptap] El cuerpo de la nota no tiene forma de documento TipTap.')
    }
    return null
  }

  const contexto: Contexto = { partidos, nivelBase }

  return (
    <div className={`prose-nota ${className}`.trimEnd()}>
      {renderHijos(documento.content, contexto, 0)}
    </div>
  )
}

function renderHijos(
  nodos: NodoTipTap[] | undefined,
  contexto: Contexto,
  profundidad: number,
): ReactNode[] {
  if (!nodos) return []

  return nodos.map((nodo, indice) => (
    // El índice alcanza como key: el árbol es estático, se arma una sola vez en
    // el servidor y no se reordena nunca.
    <Fragment key={indice}>{renderNodo(nodo, contexto, profundidad + 1)}</Fragment>
  ))
}

function renderNodo(
  nodo: NodoTipTap,
  contexto: Contexto,
  profundidad: number,
): ReactNode {
  if (profundidad > PROFUNDIDAD_MAXIMA) return null

  switch (nodo.type) {
    case 'text':
      return renderTexto(nodo)

    case 'paragraph': {
      // Los párrafos vacíos son residuo del editor: TipTap deja uno al final de
      // todo documento. Renderizarlos agrega un espacio que nadie escribió.
      if (!tieneContenido(nodo)) return null
      return <p>{renderHijos(nodo.content, contexto, profundidad)}</p>
    }

    case 'heading': {
      if (!tieneContenido(nodo)) return null
      const nivel = Math.min(contexto.nivelBase + nivelDeTitulo(nodo.attrs) - 2, 4)
      const Titulo = `h${nivel}` as 'h2' | 'h3' | 'h4'
      return <Titulo>{renderHijos(nodo.content, contexto, profundidad)}</Titulo>
    }

    case 'bulletList': {
      if (!tieneContenido(nodo)) return null
      return <ul>{renderHijos(nodo.content, contexto, profundidad)}</ul>
    }

    case 'orderedList': {
      if (!tieneContenido(nodo)) return null
      return (
        <ol start={inicioDeLista(nodo.attrs)}>
          {renderHijos(nodo.content, contexto, profundidad)}
        </ol>
      )
    }

    case 'listItem':
      return <li>{renderHijos(nodo.content, contexto, profundidad)}</li>

    case 'blockquote': {
      if (!tieneContenido(nodo)) return null
      return <blockquote>{renderHijos(nodo.content, contexto, profundidad)}</blockquote>
    }

    case 'horizontalRule':
      return <hr />

    case 'hardBreak':
      return <br />

    case 'imagen': {
      const imagen = atributosImagen(nodo.attrs)
      if (!imagen) return null
      return (
        <ImagenResponsive
          src={imagen.src}
          alt={imagen.alt}
          epigrafe={imagen.epigrafe}
          credito={imagen.credito}
          // Dentro del cuerpo la imagen nunca pasa de la medida de lectura.
          sizes="(min-width: 768px) 700px, 100vw"
        />
      )
    }

    case 'planilla': {
      const partidoId = partidoIdDeNodo(nodo.attrs)
      if (!partidoId) return null

      // Si la página no lo precargó, el nodo desaparece. Es preferible a
      // consultar la base desde acá: serían N consultas en serie, una por nodo.
      const partido = contexto.partidos.get(partidoId)
      if (!partido) return null

      return (
        <PlanillaPartido
          partido={partido}
          variante="embebida"
          nivelTitulo={contexto.nivelBase}
          // Igual que la del pie de la nota: es un aparte en medio del texto y
          // el lector tiene que poder cerrarla para seguir leyendo.
          plegable
        />
      )
    }

    default:
      // Nodo desconocido: se ignora. Que una extensión vieja del editor o un
      // resto de la migración desde WordPress aparezca en el JSON no puede
      // tumbar la nota entera.
      return null
  }
}

/**
 * Un nodo de texto con sus marcas.
 *
 * El orden de anidado es fijo y no sigue al array `marks`, que llega en el
 * orden en que se aplicaron en el editor: el link queda siempre por fuera para
 * que el área clickeable cubra todo el fragmento, negrita o no.
 */
function renderTexto(nodo: NodoTipTap): ReactNode {
  if (typeof nodo.text !== 'string' || nodo.text === '') return null

  let salida: ReactNode = nodo.text

  if (tieneMarca(nodo.marks, 'code')) salida = <code>{salida}</code>
  if (tieneMarca(nodo.marks, 'italic')) salida = <em>{salida}</em>
  if (tieneMarca(nodo.marks, 'bold')) salida = <strong>{salida}</strong>

  // Un href que no pasa el filtro deja el texto sin link. Se pierde el destino,
  // nunca la frase.
  const href = hrefDeMarcas(nodo.marks)
  if (href) {
    salida = (
      <a href={href} rel={esExterno(href) ? 'noopener noreferrer' : undefined}>
        {salida}
      </a>
    )
  }

  return salida
}

function tieneContenido(nodo: NodoTipTap): boolean {
  return (nodo.content?.length ?? 0) > 0
}
