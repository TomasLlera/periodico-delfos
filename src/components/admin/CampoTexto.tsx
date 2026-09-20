'use client'

/**
 * Un campo de texto del panel, con su etiqueta, su ayuda y su error.
 *
 * Existe para que los ocho campos del formulario no repitan ocho veces la misma
 * estructura y para que el error se muestre siempre igual: atado al campo con
 * `aria-describedby`, de modo que un lector de pantalla lo lea al entrar y no
 * quede como un texto rojo suelto que sólo se ve mirando.
 */

interface Props {
  id: string
  etiqueta: string
  valor: string
  onCambio: (valor: string) => void
  /** Lo que falta o está mal. Mostrado abajo del campo. */
  error?: string
  /** Una línea explicando qué se espera. */
  ayuda?: string
  /** Un `<textarea>` en vez de un `<input>`: para la bajada. */
  largo?: boolean
}

export function CampoTexto({ id, etiqueta, valor, onCambio, error, ayuda, largo }: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined
  const clases =
    'tactil w-full border bg-tarjeta px-3 py-2 font-display text-[0.95rem] outline-none focus-visible:border-verde-600 ' +
    (error ? 'border-roja' : 'border-linea-fuerte')

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="meta text-gris">
        {etiqueta}
      </label>

      {largo ? (
        <textarea
          id={id}
          value={valor}
          rows={3}
          onChange={(e) => onCambio(e.target.value)}
          aria-describedby={[idError, idAyuda].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          className={clases}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          aria-describedby={[idError, idAyuda].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          className={clases}
        />
      )}

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
