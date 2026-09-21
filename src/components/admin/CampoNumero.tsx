'use client'

/**
 * Un número del panel: el dorsal, la fecha del campeonato, los goles, los
 * puntos de la tabla.
 *
 * El valor es `number | null` y no `string` porque es lo que esperan los
 * esquemas de Zod y lo que va a la base. La traducción vive acá, en un solo
 * lugar, y resuelve el detalle que siempre se escapa: **un `<input
 * type="number">` vacío devuelve `''`, no `null` ni `0`**. Sin esta
 * conversión, borrar el dorsal de una jugadora lo guardaría como cero, que es
 * un dorsal inválido y un error que aparece recién contra el CHECK.
 *
 * `inputMode="numeric"` porque la tabla de posiciones y la planilla se cargan
 * desde el celular: el teclado numérico es la diferencia entre once filas en
 * un minuto y once filas en cinco.
 */

interface Props {
  id: string
  etiqueta: string
  valor: number | null
  onCambio: (valor: number | null) => void
  min?: number
  max?: number
  error?: string
  ayuda?: string
  /** Para las grillas de la tabla y el plantel, donde la etiqueta ya está en el encabezado. */
  etiquetaOculta?: boolean
}

export function CampoNumero({
  id,
  etiqueta,
  valor,
  onCambio,
  min,
  max,
  error,
  ayuda,
  etiquetaOculta,
}: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={etiquetaOculta ? 'sr-only' : 'meta text-gris'}>
        {etiqueta}
      </label>

      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={valor ?? ''}
        min={min}
        max={max}
        onChange={(e) => {
          const crudo = e.target.value
          onCambio(crudo === '' ? null : Number(crudo))
        }}
        aria-describedby={[idError, idAyuda].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={
          'tactil w-full border bg-tarjeta px-3 py-2 font-display text-[0.95rem] outline-none focus-visible:border-verde-600 ' +
          (error ? 'border-roja' : 'border-linea-fuerte')
        }
      />

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
