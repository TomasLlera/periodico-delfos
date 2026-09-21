'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ListOrdered } from 'lucide-react'

/**
 * La ventana que salta al finalizar un partido: recordá cargar la tabla.
 *
 * Existe porque la tabla de posiciones es la única excepción del proyecto a
 * "ningún dato deportivo a mano" (blueprint § 4.4). Finalizar un partido mueve
 * solo las goleadoras, la ficha de la jugadora, la portada y el fixture; la
 * tabla no, porque ahí están los otros diez equipos del campeonato y de ésos
 * no cubrimos los partidos. Como todo lo demás pasó solo, nada avisaba que
 * faltaba un paso.
 *
 * **Es `<dialog>` nativo, igual que `Ventana`**, y por lo mismo: la trampa de
 * foco, Escape y el foco que vuelve al botón los hace `showModal()` solo. La
 * diferencia con aquélla es que ésta no intercepta ninguna ruta, así que
 * cerrarla no navega a ningún lado.
 *
 * Se abre una sola vez, en el momento de finalizar. El recordatorio que **no**
 * se puede perder —el que se calcula del dato y se apaga solo— es
 * `RecordatorioTabla`, que sigue estando en el listado y arriba de esta misma
 * pantalla. Esta ventana es el golpecito en el hombro; aquél es la red.
 */

interface Props {
  temporadaId: string
  /** La fecha que hay que cargar. El link va apuntado a ella. */
  fecha: number
  onCerrar: () => void
}

export function VentanaRecordatorio({ temporadaId, fecha, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo || dialogo.open) return

    // `showModal()` y no el atributo `open`: `open` lo dibuja pero no como
    // modal —sin trampa de foco y sin `::backdrop`—, que es el error clásico
    // con este elemento.
    dialogo.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="titulo-recordatorio"
      onClose={onCerrar}
      onClick={(evento) => {
        if (evento.target === ref.current) ref.current?.close()
      }}
      className="m-0 max-h-dvh max-w-none bg-transparent p-0 backdrop:bg-negro-cancha/70"
    >
      <div className="flex min-h-dvh w-dvw items-end justify-center sm:items-center sm:p-6">
        <div className="tarjeta flex w-full flex-col gap-4 rounded-t-lg border border-linea p-5 sm:max-w-[460px] sm:rounded-lg">
          <h2 id="titulo-recordatorio" className="titular flex items-center gap-2 text-[1.05rem]">
            <ListOrdered size={18} aria-hidden="true" />
            Recordá modificar la tabla de posiciones.
          </h2>

          <p className="text-[0.9rem]">
            El resultado ya quedó cargado y se actualizaron las goleadoras y el fixture. La
            tabla de posiciones se carga a mano: el partido no mueve a los otros equipos.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* El atajo va apuntado a la fecha: llegar a la pantalla y tener
                que elegir el número otra vez es la mitad del olvido. */}
            <Link
              href={`/admin/tabla/${temporadaId}?fecha=${fecha}`}
              className="tactil flex flex-1 items-center justify-center gap-2 bg-verde-900 px-5 font-display text-[0.9rem] font-extrabold text-white hover:bg-verde-600"
            >
              <ListOrdered size={16} aria-hidden="true" />
              Cargar la fecha {fecha}
            </Link>

            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="tactil flex items-center justify-center border border-linea-fuerte px-5 font-display text-[0.9rem] font-bold hover:bg-papel-alt"
            >
              Después
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
