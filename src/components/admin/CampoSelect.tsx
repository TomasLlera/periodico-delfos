'use client'

/**
 * Un `<select>` del panel, con la misma etiqueta, ayuda y error que
 * `CampoTexto`.
 *
 * Existe porque el CRUD de entidades tiene catorce selects —temporada, equipo
 * local, visitante, estado, posición— y los tres que ya estaban escritos a
 * mano en `CamposClasificacion` no tenían dónde mostrar un error: el partido
 * sin elegir fallaba en el servidor y volvía como un aviso al pie, lejos del
 * campo que había que tocar.
 *
 * La opción vacía se pide explícita con `vacio`: en un `<select>` obligatorio
 * —el equipo local de un partido— no tiene que haber ninguna, porque una
 * opción "Ninguno" que después Zod rechaza es una trampa.
 */

interface Opcion {
  valor: string
  nombre: string
}

interface Props {
  id: string
  etiqueta: string
  valor: string
  opciones: readonly Opcion[]
  onCambio: (valor: string) => void
  /** El texto de la opción vacía. Sin esto, el campo no tiene opción vacía. */
  vacio?: string
  error?: string
  ayuda?: string
  deshabilitado?: boolean
}

export function CampoSelect({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  vacio,
  error,
  ayuda,
  deshabilitado,
}: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="meta text-gris">
        {etiqueta}
      </label>

      <select
        id={id}
        value={valor}
        disabled={deshabilitado}
        onChange={(e) => onCambio(e.target.value)}
        aria-describedby={[idError, idAyuda].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={
          'tactil w-full border bg-tarjeta px-3 font-display text-[0.95rem] disabled:opacity-60 ' +
          (error ? 'border-roja' : 'border-linea-fuerte')
        }
      >
        {vacio !== undefined && <option value="">{vacio}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.nombre}
          </option>
        ))}
      </select>

      {error && (
        <p id={idError} className="text-[0.85rem] text-roja">
          {error}
        </p>
      )}

      {ayuda && (
        <p id={idAyuda} className="text-[0.8rem] text-gris">
          {ayuda}
        </p>
      )}
    </div>
  )
}
