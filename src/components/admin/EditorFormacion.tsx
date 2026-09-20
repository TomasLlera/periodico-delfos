'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Save } from 'lucide-react'
import { guardarFormacion } from '@/actions/formaciones'
import {
  avisosDeFormacion,
  contar,
  filasDeConvocatoria,
  filasParaGuardar,
  type Convocatoria,
  type FilaConvocatoria,
} from '@/lib/entidades/formacion'
import { Aviso } from '@/components/admin/Aviso'
import type { FormacionConJugadora, JugadoraEnPlantel } from '@/types'

/**
 * Quiénes juegan este partido.
 *
 * Es la pantalla que le faltaba al panel para que la planilla sirviera: la
 * grilla de la planilla se arma con las titulares, así que un partido sin
 * formación no deja cargar un gol.
 *
 * **Tres estados y no dos casillas.** Titular, suplente y fuera es una sola
 * decisión por jugadora; con dos casillas —"convocada" y "titular"— hay cuatro
 * combinaciones y una es imposible, y es justo la que se marca sin querer.
 */

const LUGARES: readonly { valor: Convocatoria; nombre: string }[] = [
  { valor: 'titular', nombre: 'Titular' },
  { valor: 'suplente', nombre: 'Suplente' },
  { valor: 'fuera', nombre: 'Fuera' },
]

interface Props {
  partidoId: string
  plantel: readonly JugadoraEnPlantel[]
  formacion: readonly FormacionConJugadora[]
}

export function EditorFormacion({ partidoId, plantel, formacion }: Props) {
  const router = useRouter()
  const [filas, setFilas] = useState<FilaConvocatoria[]>(() =>
    filasDeConvocatoria(plantel, formacion),
  )
  const [aviso, setAviso] = useState<string | null>(null)
  const [guardando, empezar] = useTransition()

  const titulares = contar(filas, 'titular')
  const suplentes = contar(filas, 'suplente')
  const avisos = avisosDeFormacion(filas)

  function mover(jugadoraId: string, convocatoria: Convocatoria) {
    setFilas((previas) =>
      previas.map((f) => (f.jugadora_id === jugadoraId ? { ...f, convocatoria } : f)),
    )
  }

  function guardar() {
    empezar(async () => {
      const r = await guardarFormacion(partidoId, filasParaGuardar(filas))
      if (r.error) {
        setAviso(r.error)
        return
      }
      setAviso('Formación guardada')
      router.refresh()
    })
  }

  if (plantel.length === 0 && formacion.length === 0) {
    return (
      <Aviso tono="atencion">
        El plantel de esta temporada está vacío, así que no hay a quién convocar. Se arma en
        Temporadas → Plantel.
      </Aviso>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="meta text-gris">
        {titulares} titulares · {suplentes} suplentes
      </p>

      {avisos.map((texto) => (
        <Aviso key={texto} tono="atencion">
          {texto}
        </Aviso>
      ))}

      <ul>
        {filas.map((fila) => (
          <li
            key={fila.jugadora_id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-linea py-2"
          >
            <span className="w-8 font-mono text-[0.9rem] text-gris">
              {fila.dorsal ?? '—'}
            </span>

            <span className="font-display text-[0.95rem] font-bold">
              {fila.apellido}, {fila.nombre}
            </span>

            {fila.fueraDelPlantel && (
              <span className="meta bg-papel-alt px-2 py-0.5 text-gris">Ya no está en el plantel</span>
            )}

            {/* Un grupo de radios y no tres botones: es una sola elección de
                tres, y así se navega con las flechas y lo anuncia el lector de
                pantalla como lo que es. */}
            <fieldset className="ml-auto flex items-center gap-1">
              <legend className="sr-only">
                Lugar de {fila.nombre} {fila.apellido} en el partido
              </legend>

              {LUGARES.map((lugar) => {
                const id = `${fila.jugadora_id}-${lugar.valor}`
                const elegido = fila.convocatoria === lugar.valor

                return (
                  <label
                    key={lugar.valor}
                    htmlFor={id}
                    className={
                      'tactil flex cursor-pointer items-center px-3 font-display text-[0.8rem] font-bold ' +
                      (elegido
                        ? 'bg-verde-900 text-white'
                        : 'border border-linea-fuerte hover:bg-papel-alt')
                    }
                  >
                    <input
                      id={id}
                      type="radio"
                      name={`convocatoria-${fila.jugadora_id}`}
                      checked={elegido}
                      onChange={() => mover(fila.jugadora_id, lugar.valor)}
                      className="sr-only"
                    />
                    {lugar.nombre}
                  </label>
                )
              })}
            </fieldset>
          </li>
        ))}
      </ul>

      {aviso && (
        <p role="status" className="border-l-2 border-verde-600 bg-papel-alt px-3 py-2 text-[0.9rem]">
          {aviso}
        </p>
      )}

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-linea bg-papel py-3">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="tactil flex items-center gap-2 bg-verde-900 px-5 font-display text-[0.9rem] font-extrabold text-white hover:bg-verde-600 disabled:opacity-60"
        >
          <Save size={16} aria-hidden="true" />
          {guardando ? 'Guardando…' : 'Guardar la formación'}
        </button>
      </div>
    </div>
  )
}
