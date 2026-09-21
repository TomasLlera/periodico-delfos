'use client'

import type { ChequeoMarcador } from '@/lib/planilla'

/**
 * El marcador que va saliendo de los goles cargados, y el botón de finalizar.
 *
 * **El número grande es el que sale de los eventos, no el que se escribió al
 * crear el partido.** Cuando los dos no coinciden, la pantalla lo dice y **no
 * corrige**: cuál de los dos está bien no lo sabe el sistema. Puede faltar
 * cargar un gol o puede estar mal tipeado el resultado, y quien vio el partido
 * decide. Es el "Finalizar partido con verificación" del blueprint § 7.6.
 *
 * Con la cola offline andando, el marcador **incluye lo que todavía no subió**:
 * el gol cargado sin señal ya cuenta acá, porque desde el punto de vista de
 * quien carga ese gol ya está hecho.
 *
 * Salió de `PlanillaCarga` cuando pasó las 300 líneas que fija CLAUDE.md.
 */

interface Props {
  marcador: ChequeoMarcador
  ocupado: boolean
  onFinalizar: () => void
  /** Cuántos eventos esperan todavía. Finalizar con cola es finalizar a medias. */
  pendientes: number
}

export function PieMarcador({ marcador, ocupado, onFinalizar, pendientes }: Props) {
  return (
    <section className="flex flex-wrap items-center gap-3 border-t border-linea pt-4">
      <p className="font-display text-[0.95rem]">
        Van <strong className="font-mono">{marcador.cargado.local}</strong> –{' '}
        <strong className="font-mono">{marcador.cargado.visitante}</strong>
        {marcador.declarado && !marcador.coincide && (
          <span className="ml-2 text-roja">
            (cargaste {marcador.declarado.local}–{marcador.declarado.visitante} al crear el
            partido: falta cargar algún gol)
          </span>
        )}
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-3">
        {/* Finalizar escribe el resultado en la base, y lo hace con la cuenta
            que se ve arriba: si esa cuenta incluye goles que todavía no
            subieron, el resultado guardado sería correcto y la planilla
            quedaría sin esos goles. Se avisa antes en vez de bloquear, que es
            el criterio de toda esta pantalla. */}
        {pendientes > 0 && (
          <span className="text-[0.85rem] text-roja">
            Faltan subir {pendientes} evento{pendientes > 1 ? 's' : ''}
          </span>
        )}

        <button
          type="button"
          onClick={onFinalizar}
          disabled={ocupado}
          className="tactil bg-amarillo px-5 font-display text-[0.9rem] font-extrabold text-negro-cancha disabled:opacity-60"
        >
          Finalizar partido
        </button>
      </div>
    </section>
  )
}
