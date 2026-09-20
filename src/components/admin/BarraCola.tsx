'use client'

/**
 * El estado de la cola offline: qué está esperando para subir.
 *
 * **Sólo aparece cuando hay algo pendiente.** Una barra permanente que anuncia
 * que todo está bien es ruido en una pantalla que se mira de reojo con el
 * partido en juego, y el silencio es información: si no dice nada, subió todo.
 *
 * `role="status"` y no `"alert"`: no es un error, es información. Un `alert`
 * interrumpe al lector de pantalla en medio de la carga del evento siguiente.
 *
 * Salió de `PlanillaCarga` cuando pasó las 300 líneas que fija CLAUDE.md.
 */

interface Props {
  /** La línea que ya armó `estadoDeLaCola()`. `null` si no hay nada que decir. */
  estado: string | null
  hayConexion: boolean
  onReintentar: () => void
}

export function BarraCola({ estado, hayConexion, onReintentar }: Props) {
  if (!estado) return null

  return (
    <p
      role="status"
      className={
        'flex flex-wrap items-center gap-3 border-l-2 bg-papel-alt px-3 py-2 text-[0.9rem] ' +
        (hayConexion ? 'border-amarillo' : 'border-roja')
      }
    >
      <span>{estado}</span>

      {/* Reintentar a mano. La cola reintenta sola cuando vuelve la señal, pero
          el navegador a veces dice que hay conexión cuando el wifi de la cancha
          contesta y no navega. */}
      <button
        type="button"
        onClick={onReintentar}
        className="tactil px-2 font-display text-[0.85rem] font-bold underline underline-offset-4"
      >
        Reintentar ahora
      </button>
    </p>
  )
}
