'use client'

import { Casilla } from '@/components/admin/Casilla'
import { etiquetaDePartido } from '@/lib/partido'
import type { EntradaNota } from '@/lib/nota'
import type { PartidoConEquipos, Temporada } from '@/types'

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
  partidos: readonly PartidoConEquipos[]
  onCambio: <C extends keyof EntradaNota>(campo: C, valor: EntradaNota[C]) => void
}

export function CamposClasificacion({ entrada, temporadas, partidos, onCambio }: Props) {
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

      {/**
       * El partido de la nota.
       *
       * Es el campo que enciende todo lo deportivo: con él puesto, la nota
       * muestra el marcador abajo de la imagen, la planilla completa al pie, y
       * se enlaza con las otras notas del mismo partido —la previa, la crónica
       * y el análisis—. Sin él, la nota es sólo texto.
       *
       * **No se escribe ningún dato del partido acá**: sólo se elige cuál. Los
       * goles, las tarjetas y las formaciones se cargan en la planilla, que es
       * otra pantalla y otro momento (regla no negociable 2).
       */}
      <div className="flex flex-col gap-1">
        <label htmlFor="partido" className="meta text-gris">
          Partido
        </label>
        <select
          id="partido"
          value={entrada.partido_id ?? ''}
          onChange={(e) => onCambio('partido_id', e.target.value || null)}
          className="tactil border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.95rem]"
        >
          <option value="">Ninguno</option>
          {partidos.map((p) => (
            <option key={p.id} value={p.id}>
              {etiquetaDePartido(p)}
            </option>
          ))}
        </select>
        <p className="text-[0.8rem] text-gris">
          {partidos.length === 0
            ? 'Todavía no hay partidos cargados. Se crean en Partidos → Partido nuevo.'
            : 'Al elegirlo, la nota muestra el marcador y la planilla, y se enlaza con las otras notas de ese partido.'}
        </p>
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
