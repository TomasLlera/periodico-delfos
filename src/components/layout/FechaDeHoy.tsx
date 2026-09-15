'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * La fecha del día en la cabecera, como la de un diario impreso.
 *
 * **Por qué es cliente y no servidor:** la portada se prerenderiza, así que un
 * `new Date()` en el servidor se congela en el momento del build y el sitio
 * queda mostrando la fecha del último deploy. Un diario con la fecha de
 * anteayer es peor que un diario sin fecha.
 *
 * El primer render —servidor e hidratación— devuelve un espacio duro: reserva
 * el alto de la línea, así que no hay salto cuando entra la fecha real. Como
 * los dos renders coinciden, no hace falta `suppressHydrationWarning`.
 *
 * `first-letter:uppercase` y no `capitalize`: en español el día va en
 * minúscula, pero acá abre línea. `capitalize` pondría "15 De Septiembre De".
 */
export function FechaDeHoy() {
  const [hoy, setHoy] = useState<{ texto: string; iso: string } | null>(null)

  useEffect(() => {
    const ahora = new Date()
    setHoy({
      texto: format(ahora, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
      iso: format(ahora, 'yyyy-MM-dd'),
    })
  }, [])

  return (
    <time dateTime={hoy?.iso} className="block first-letter:uppercase">
      {hoy?.texto ?? '\u00A0'}
    </time>
  )
}
