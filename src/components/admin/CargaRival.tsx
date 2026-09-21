'use client'

/**
 * Quién hizo el gol del rival: un nombre escrito a mano.
 *
 * Es el único dato deportivo que el proyecto guarda como texto libre, y está
 * razonado: `eventos.jugadora_nombre` existe porque no tenemos el plantel de
 * Claypole cargado ni lo vamos a tener. Por eso el gol de una rival **no entra
 * en la tabla de goleadoras** —la vista pide `jugadora_id`— y está bien que no
 * entre: agrupar por un apellido tipeado daría "Pérez" y "perez" como dos.
 *
 * Es el único caso de la planilla con botón de confirmar, y no es una
 * inconsistencia: acá no hay una grilla de caras que tocar, hay que terminar de
 * escribir. El evento no puede guardarse en cada tecla.
 *
 * Salió de `PlanillaCarga` cuando volvió a pasar las 300 líneas que fija
 * CLAUDE.md, al entrar la ventana del recordatorio de la tabla.
 */

interface Props {
  nombre: string
  onNombre: (valor: string) => void
  onCargar: () => void
  ocupado: boolean
}

export function CargaRival({ nombre, onNombre, onCargar, ocupado }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="rival" className="meta text-gris">
          Quién, del rival
        </label>
        <input
          id="rival"
          type="text"
          value={nombre}
          onChange={(e) => onNombre(e.target.value)}
          placeholder="Apellido"
          className="tactil border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.95rem]"
        />
      </div>

      <button
        type="button"
        onClick={onCargar}
        disabled={ocupado}
        className="tactil bg-verde-900 px-5 font-display text-[0.9rem] font-extrabold text-white disabled:opacity-60"
      >
        Cargar
      </button>
    </div>
  )
}
