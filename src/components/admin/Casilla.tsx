'use client'

/**
 * Una casilla de verificación del panel.
 *
 * Estaba escrita adentro de `CamposClasificacion` —"Destacada en la portada",
 * "Postear a las redes"— y el CRUD de entidades necesita otras seis: el equipo
 * propio, la temporada activa, la jugadora activa, la capitana, la titular.
 * Sacarla ahí evita que la séptima se escriba con un área táctil distinta.
 *
 * Toda la fila es el `<label>` y no sólo el cuadradito: 16 píxeles de lado no
 * son un blanco táctil, y `.tactil` sobre la etiqueta entera le da los 44 que
 * pide el design system.
 */

interface Props {
  id: string
  etiqueta: string
  valor: boolean
  onCambio: (valor: boolean) => void
  /** Una línea explicando qué pasa al marcarla. */
  ayuda?: string
}

export function Casilla({ id, etiqueta, valor, onCambio, ayuda }: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="tactil flex items-center gap-2 text-[0.9rem]">
        <input
          id={id}
          type="checkbox"
          checked={valor}
          onChange={(e) => onCambio(e.target.checked)}
          aria-describedby={idAyuda}
          className="size-4 accent-verde-900"
        />
        {etiqueta}
      </label>

      {ayuda && (
        <p id={idAyuda} className="text-[0.8rem] text-gris">
          {ayuda}
        </p>
      )}
    </div>
  )
}
