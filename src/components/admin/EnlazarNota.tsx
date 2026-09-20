'use client'

import { useState } from 'react'
import { Link2, X } from 'lucide-react'
import { etiquetaCategoria } from '@/lib/formato'
import type { Categoria } from '@/types'

/**
 * Elegir a qué nota apunta un link del cuerpo.
 *
 * Es lo que pidió el autor con un ejemplo que explica bien para qué sirve: en
 * la crónica del partido se menciona la lesión de una jugadora, y esa mención
 * lleva a la nota donde se contó cómo se lesionó.
 *
 * **Se elige de una lista, no se pega una URL.** Pegar el link a mano se
 * escribe mal, y sobre todo: no hay forma de saber después qué notas citan a
 * cuál. Eligiendo de la lista, el href sale del slug real de la nota.
 *
 * Igual queda el campo de URL libre, porque una nota cita fuentes que no son
 * del sitio —el reglamento de AFA, la cuenta del club— y para eso no hay lista
 * posible.
 *
 * El filtro corre en el navegador y no contra la base: son setenta notas, y
 * pegarle a Supabase en cada tecla sería más lento que filtrar un array.
 */

export interface NotaEnlazable {
  id: string
  titulo: string
  slug: string
  categoria: Categoria
}

interface Props {
  notas: readonly NotaEnlazable[]
  /** La que se está editando: no tiene sentido que se enlace a sí misma. */
  idActual: string | null
  onElegir: (href: string) => void
  onCerrar: () => void
}

export function EnlazarNota({ notas, idActual, onElegir, onCerrar }: Props) {
  const [filtro, setFiltro] = useState('')
  const [url, setUrl] = useState('')

  const termino = filtro.trim().toLowerCase()
  const candidatas = notas
    .filter((n) => n.id !== idActual)
    .filter((n) => termino === '' || n.titulo.toLowerCase().includes(termino))
    .slice(0, 12)

  return (
    <div className="flex flex-col gap-3 border-b border-linea bg-papel-alt p-3">
      <div className="flex items-center gap-2">
        <p className="meta text-gris">Anclar una nota</p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="tactil ml-auto flex items-center justify-center px-2 hover:text-roja"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <input
        type="search"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder="Buscar por título…"
        aria-label="Buscar una nota por título"
        className="tactil border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.9rem]"
      />

      {notas.length === 0 ? (
        <p className="text-[0.85rem] text-gris">
          Todavía no hay notas publicadas para enlazar. Un borrador no se puede anclar: para el
          lector sería un 404.
        </p>
      ) : (
        <ul className="flex max-h-56 flex-col overflow-y-auto">
          {candidatas.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onElegir(`/nota/${n.slug}`)}
                className="tactil flex w-full flex-col items-start gap-0.5 border-b border-linea px-2 py-2 text-left hover:bg-papel"
              >
                <span className="font-display text-[0.9rem] font-bold leading-tight">
                  {n.titulo}
                </span>
                <span className="meta text-gris">{etiquetaCategoria(n.categoria)}</span>
              </button>
            </li>
          ))}
          {candidatas.length === 0 && (
            <li className="px-2 py-2 text-[0.85rem] text-gris">Ninguna coincide.</li>
          )}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2 border-t border-linea pt-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="url-libre" className="meta text-gris">
            O una dirección de afuera
          </label>
          <input
            id="url-libre"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="tactil border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.9rem]"
          />
        </div>
        <button
          type="button"
          onClick={() => url.trim() && onElegir(url.trim())}
          className="tactil flex items-center gap-2 border border-linea-fuerte px-4 font-display text-[0.9rem] font-bold hover:bg-papel"
        >
          <Link2 size={16} aria-hidden="true" />
          Enlazar
        </button>
      </div>
    </div>
  )
}
