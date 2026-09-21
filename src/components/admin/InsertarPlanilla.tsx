'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { etiquetaDePartido } from '@/lib/partido'
import type { PartidoConEquipos } from '@/types'

/**
 * Elegir qué partido se embebe en el medio del cuerpo.
 *
 * Es el último eslabón de la regla no negociable 2: hasta ahora la planilla
 * aparecía sola al pie de las notas con `partido_id`, y esto deja ponerla donde
 * va en una crónica —después del relato del primer tiempo, no al final de
 * todo—. **Ningún gol se escribe a mano**: el nodo guarda el id y el sitio
 * dibuja lo que haya en `eventos` al momento de leer.
 *
 * Eso último es la razón de que se guarde el id y no el nombre del partido: si
 * después se corrige un gol en la planilla, la nota publicada muestra el
 * resultado corregido sin tocarla.
 *
 * El filtro corre en el navegador: son cincuenta partidos, ya están en memoria
 * porque el selector de la nota los usa, y pegarle a Supabase en cada tecla
 * sería más lento que filtrar un array.
 */

interface Props {
  partidos: readonly PartidoConEquipos[]
  onElegir: (partidoId: string) => void
  onCerrar: () => void
}

export function InsertarPlanilla({ partidos, onElegir, onCerrar }: Props) {
  const [filtro, setFiltro] = useState('')

  const termino = filtro.trim().toLowerCase()
  const candidatos = partidos
    .filter((p) => termino === '' || etiquetaDePartido(p).toLowerCase().includes(termino))
    .slice(0, 12)

  return (
    <div className="flex flex-col gap-3 border-b border-linea bg-papel-alt p-3">
      <div className="flex items-center gap-2">
        <p className="meta text-gris">Embeber una planilla</p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="tactil ml-auto flex items-center justify-center px-2 hover:text-roja"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {partidos.length === 0 ? (
        <p className="text-[0.85rem] text-gris">
          Todavía no hay partidos cargados. Se crean en Partidos → Partido nuevo.
        </p>
      ) : (
        <>
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por rival o por fecha…"
            aria-label="Buscar un partido"
            className="tactil border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.9rem]"
          />

          <ul className="flex max-h-56 flex-col overflow-y-auto">
            {candidatos.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onElegir(p.id)}
                  className="tactil flex w-full flex-col items-start gap-0.5 border-b border-linea px-2 py-2 text-left hover:bg-papel"
                >
                  <span className="font-display text-[0.9rem] font-bold leading-tight">
                    {etiquetaDePartido(p)}
                  </span>
                  <span className="meta text-gris">{p.temporada.nombre}</span>
                </button>
              </li>
            ))}
            {candidatos.length === 0 && (
              <li className="px-2 py-2 text-[0.85rem] text-gris">Ninguno coincide.</li>
            )}
          </ul>
        </>
      )}

      <p className="text-[0.8rem] text-gris">
        Se guarda cuál es el partido, no el resultado: si después se corrige un gol en la
        planilla, la nota lo muestra corregido sin tocarla.
      </p>
    </div>
  )
}
