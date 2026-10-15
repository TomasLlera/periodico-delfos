'use client'

import { RotateCcw } from 'lucide-react'

/**
 * Cuando algo del panel revienta sin que nadie lo ataje.
 *
 * Hasta que existió esto, **un corte de señal al guardar una nota terminaba
 * en la pantalla genérica de Next**: crema, una línea en inglés —"Application
 * error: a client-side exception has occurred"— y ningún botón. Se vio en una
 * prueba con Playwright cortando la red. El formulario ahora ataja ese caso
 * solo (`enviar()` en `FormularioNota`); esto queda para lo que no se previó.
 *
 * Va adentro del grupo `(panel)` y no en `/admin`: así la barra del panel
 * sigue dibujada, y se puede ir a otra sección sin recargar.
 *
 * Reintentar no pierde la nota: lo escrito ya estaba en el borrador del
 * dispositivo y el editor lo ofrece al volver a abrirse.
 */

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorDelPanel({ error, reset }: Props) {
  return (
    <main className="mx-auto flex max-w-[900px] flex-col gap-4 px-4 py-8">
      <h1 className="titular text-[1.6rem]">Algo salió mal</h1>
      <p className="max-w-[60ch] text-text-soft">
        La pantalla no pudo terminar lo que estaba haciendo. Si fue un corte de señal, esperá a
        que vuelva y reintentá. Si estabas escribiendo una nota, lo escrito quedó guardado en este
        dispositivo: el editor te lo va a ofrecer al abrirlo.
      </p>
      {error.digest && (
        <p className="meta text-text-muted">Código para reportarlo: {error.digest}</p>
      )}
      <div>
        <button
          type="button"
          onClick={reset}
          className="tactil flex items-center gap-2 bg-text px-5 font-display text-[0.9rem] font-extrabold text-bg hover:bg-text/85"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Reintentar
        </button>
      </div>
    </main>
  )
}
