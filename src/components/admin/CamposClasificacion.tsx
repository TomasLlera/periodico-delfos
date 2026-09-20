'use client'

import type { EntradaNota } from '@/lib/nota'
import type { Temporada } from '@/types'

/**
 * Lo que clasifica la nota y decide qué hace el sistema con ella: categoría,
 * temporada, si va destacada en la portada y si se postea a las redes.
 *
 * Salió de `FormularioNota` cuando pasó las 300 líneas que fija CLAUDE.md. No
 * es un corte arbitrario: estos cuatro campos no son el contenido de la nota
 * —eso es el título, la bajada y el cuerpo— sino metadatos, y se editan una vez
 * y casi nunca se vuelven a tocar.
 */

const CATEGORIAS = [
  ['cronica', 'Crónica'],
  ['analisis', 'Análisis'],
  ['temporada', 'Temporada'],
  ['plantel', 'Plantel'],
  ['institucional', 'Institucional'],
] as const

interface Props {
  entrada: EntradaNota
  temporadas: readonly Temporada[]
  onCambio: <C extends keyof EntradaNota>(campo: C, valor: EntradaNota[C]) => void
}

export function CamposClasificacion({ entrada, temporadas, onCambio }: Props) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="categoria" className="meta text-gris">
            Categoría
          </label>
          <select
            id="categoria"
            value={entrada.categoria}
            onChange={(e) => onCambio('categoria', e.target.value as EntradaNota['categoria'])}
            className="tactil border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.95rem]"
          >
            {CATEGORIAS.map(([valor, nombre]) => (
              <option key={valor} value={valor}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="temporada" className="meta text-gris">
            Temporada
          </label>
          <select
            id="temporada"
            value={entrada.temporada_id ?? ''}
            onChange={(e) => onCambio('temporada_id', e.target.value || null)}
            className="tactil border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.95rem]"
          >
            <option value="">Ninguna</option>
            {temporadas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <Casilla
          id="destacada"
          etiqueta="Destacada en la portada"
          valor={entrada.destacada}
          onCambio={(v) => onCambio('destacada', v)}
        />
        <Casilla
          id="auto_post"
          etiqueta="Postear a las redes al publicar"
          valor={entrada.auto_post}
          onCambio={(v) => onCambio('auto_post', v)}
        />
      </div>
    </>
  )
}

function Casilla({
  id,
  etiqueta,
  valor,
  onCambio,
}: {
  id: string
  etiqueta: string
  valor: boolean
  onCambio: (v: boolean) => void
}) {
  return (
    <label htmlFor={id} className="tactil flex items-center gap-2 text-[0.9rem]">
      <input
        id={id}
        type="checkbox"
        checked={valor}
        onChange={(e) => onCambio(e.target.checked)}
        className="size-4 accent-verde-900"
      />
      {etiqueta}
    </label>
  )
}
