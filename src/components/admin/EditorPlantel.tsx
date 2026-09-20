'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Plus, Save } from 'lucide-react'
import { guardarFilaPlantel, sacarDelPlantel } from '@/actions/plantel'
import { capitanas, duenaDelDorsal, jugadorasDisponibles } from '@/lib/entidades/plantel'
import { NOMBRE_PUESTO, nombreCompleto, ordenarPlantel } from '@/lib/plantel'
import { Aviso } from '@/components/admin/Aviso'
import { BotonBorrar } from '@/components/admin/BotonBorrar'
import { CampoNumero } from '@/components/admin/CampoNumero'
import { CampoSelect } from '@/components/admin/CampoSelect'
import type { Jugadora, JugadoraEnPlantel, Posicion } from '@/types'

/**
 * El plantel de una temporada: quién está y con qué número.
 *
 * Es de lo que cuelga la formación de cada partido, y por lo tanto la grilla
 * de la planilla de carga. El dorsal vive acá y no en la ficha de la jugadora
 * porque cambia de un año a otro (blueprint § 4.2).
 *
 * **Se agrega de a una y se guarda todo junto.** Agregar es el momento en que
 * hace falta elegir a alguien de una lista de treinta; corregir un dorsal es
 * tocar un número en una fila que ya está. Son dos gestos distintos y la
 * pantalla los trata distinto.
 */

const PUESTOS: readonly Posicion[] = [
  'arquera',
  'defensora',
  'mediocampista',
  'delantera',
  'dt',
  'ayudante',
]

interface Props {
  temporadaId: string
  plantel: readonly JugadoraEnPlantel[]
  /** Todas las fichas, para el selector de agregar. */
  jugadoras: readonly Jugadora[]
}

export function EditorPlantel({ temporadaId, plantel, jugadoras }: Props) {
  const router = useRouter()
  const [filas, setFilas] = useState<JugadoraEnPlantel[]>(() => ordenarPlantel(plantel))
  const [tocadas, setTocadas] = useState<Set<string>>(new Set())
  const [aSumar, setASumar] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, empezar] = useTransition()

  const disponibles = jugadorasDisponibles(jugadoras, filas)
  const conCinta = capitanas(filas)

  function tocar(jugadoraId: string, cambio: Partial<JugadoraEnPlantel>) {
    setFilas((previas) =>
      previas.map((f) => (f.id === jugadoraId ? { ...f, ...cambio } : f)),
    )
    setTocadas((previas) => new Set(previas).add(jugadoraId))
  }

  /** Guarda una fila sola. Lo usan agregar y el guardado de todas. */
  async function guardarFila(fila: JugadoraEnPlantel) {
    return guardarFilaPlantel({
      temporada_id: temporadaId,
      jugadora_id: fila.id,
      dorsal: fila.dorsal,
      posicion: fila.posicion_temporada,
      capitana: fila.capitana,
    })
  }

  function agregar() {
    const jugadora = jugadoras.find((j) => j.id === aSumar)
    if (!jugadora) return

    empezar(async () => {
      const r = await guardarFilaPlantel({
        temporada_id: temporadaId,
        jugadora_id: jugadora.id,
        // Sin dorsal: se pone después, mirando la lista para no repetir.
        dorsal: null,
        posicion: null,
        capitana: false,
      })

      if (r.error) {
        setAviso(r.error)
        return
      }

      setFilas((previas) =>
        ordenarPlantel([
          ...previas,
          { ...jugadora, dorsal: null, posicion_temporada: null, capitana: false },
        ]),
      )
      setASumar('')
      setAviso(null)
      router.refresh()
    })
  }

  function guardarTodo() {
    empezar(async () => {
      for (const fila of filas.filter((f) => tocadas.has(f.id))) {
        const r = await guardarFila(fila)
        if (r.error) {
          setAviso(`${fila.apellido}: ${r.error}`)
          return
        }
      }

      setTocadas(new Set())
      setAviso('Plantel guardado')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Agregar va arriba: en una temporada nueva es lo único que se hace, y
          en una cargada es lo que se busca al entrar. */}
      <div className="flex flex-wrap items-end gap-3 border border-linea bg-tarjeta p-4">
        <div className="min-w-[240px] flex-1">
          <CampoSelect
            id="a-sumar"
            etiqueta="Sumar al plantel"
            valor={aSumar}
            opciones={disponibles.map((j) => ({ valor: j.id, nombre: nombreCompleto(j) }))}
            onCambio={setASumar}
            vacio={
              disponibles.length === 0
                ? 'Ya están todas las jugadoras del club'
                : 'Elegir jugadora'
            }
            deshabilitado={disponibles.length === 0}
            ayuda="Sólo aparecen las que están en el club y todavía no están en este plantel."
          />
        </div>

        <button
          type="button"
          onClick={agregar}
          disabled={ocupado || aSumar === ''}
          className="tactil flex items-center gap-2 bg-amarillo px-4 font-display text-[0.9rem] font-extrabold text-negro-cancha disabled:opacity-60"
        >
          <Plus size={16} aria-hidden="true" />
          Sumar
        </button>
      </div>

      {conCinta.length > 1 && (
        <Aviso tono="atencion">
          Hay {conCinta.length} capitanas marcadas: {conCinta.map((j) => j.apellido).join(', ')}.
        </Aviso>
      )}

      {filas.length === 0 ? (
        <Aviso>
          El plantel está vacío. Hasta que tenga jugadoras, los partidos de esta temporada no
          pueden armar su formación y la planilla abre con la grilla vacía.
        </Aviso>
      ) : (
        <ul className="flex flex-col gap-3">
          {filas.map((fila) => {
            const duena = duenaDelDorsal(fila.dorsal, filas, fila.id)

            return (
              <li
                key={fila.id}
                className="flex flex-wrap items-end gap-3 border-b border-linea pb-3"
              >
                <span className="min-w-[160px] flex-1 font-display text-[0.95rem] font-bold">
                  {nombreCompleto(fila)}
                </span>

                <div className="w-20">
                  <CampoNumero
                    id={`dorsal-${fila.id}`}
                    etiqueta={`Dorsal de ${fila.apellido}`}
                    etiquetaOculta
                    valor={fila.dorsal}
                    onCambio={(v) => tocar(fila.id, { dorsal: v })}
                    min={1}
                    max={99}
                    error={duena ? `Lo tiene ${duena.apellido}` : undefined}
                  />
                </div>

                <div className="w-44">
                  <CampoSelect
                    id={`posicion-${fila.id}`}
                    etiqueta={`Puesto de ${fila.apellido} esta temporada`}
                    valor={fila.posicion_temporada ?? ''}
                    opciones={PUESTOS.map((p) => ({ valor: p, nombre: NOMBRE_PUESTO[p] }))}
                    onCambio={(v) =>
                      tocar(fila.id, { posicion_temporada: (v || null) as Posicion | null })
                    }
                    vacio={`El de su ficha (${NOMBRE_PUESTO[fila.posicion]})`}
                  />
                </div>

                <label
                  htmlFor={`capitana-${fila.id}`}
                  className="tactil flex items-center gap-2 text-[0.85rem]"
                >
                  <input
                    id={`capitana-${fila.id}`}
                    type="checkbox"
                    checked={fila.capitana}
                    onChange={(e) => tocar(fila.id, { capitana: e.target.checked })}
                    className="size-4 accent-verde-900"
                  />
                  Capitana
                </label>

                <BotonBorrar
                  que={`a ${fila.apellido} del plantel`}
                  borrar={async () => {
                    const r = await sacarDelPlantel(temporadaId, fila.id)
                    if (!r.error) setFilas((previas) => previas.filter((f) => f.id !== fila.id))
                    return r
                  }}
                />
              </li>
            )
          })}
        </ul>
      )}

      {aviso && (
        <p role="status" className="border-l-2 border-verde-600 bg-papel-alt px-3 py-2 text-[0.9rem]">
          {aviso}
        </p>
      )}

      {filas.length > 0 && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-linea bg-papel py-3">
          <button
            type="button"
            onClick={guardarTodo}
            disabled={ocupado || tocadas.size === 0}
            className="tactil flex items-center gap-2 bg-verde-900 px-5 font-display text-[0.9rem] font-extrabold text-white hover:bg-verde-600 disabled:opacity-60"
          >
            <Save size={16} aria-hidden="true" />
            {ocupado ? 'Guardando…' : 'Guardar los cambios'}
          </button>

          {/* Sumar y sacar guardan solos; los dorsales y los puestos no, así
              que hay que decir cuántos quedan sin guardar. */}
          <span className="text-[0.85rem] text-gris">
            {tocadas.size === 0
              ? 'No hay cambios sin guardar.'
              : `${tocadas.size} fila${tocadas.size > 1 ? 's' : ''} sin guardar.`}
          </span>
        </div>
      )}
    </div>
  )
}
