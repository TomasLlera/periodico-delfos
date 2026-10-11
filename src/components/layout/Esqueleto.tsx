/**
 * Las barras grises que ocupan el lugar del contenido mientras carga.
 *
 * **Existen para que el click conteste.** Sin un `loading.tsx`, Next deja la
 * pantalla anterior congelada hasta que el servidor responde entera la
 * siguiente: el lector aprieta, no pasa nada, y vuelve a apretar. Con esto la
 * navegación contesta en el cuadro siguiente aunque los datos tarden lo mismo.
 *
 * **No es una animación decorativa**: `animate-pulse` es lo que distingue "esto
 * está cargando" de "esto quedó roto y gris". Se apaga con `motion-reduce`,
 * porque para quien pidió menos movimiento un latido permanente en pantalla es
 * exactamente lo que pidió no tener.
 *
 * `aria-hidden` en todas: lo que anuncia la carga es el `role="status"` del
 * contenedor, una vez. Un lector de pantalla leyendo quince barras vacías es
 * peor que el silencio.
 */
interface Props {
  /** Alto de la barra, como utilidad de Tailwind: `h-4`, `h-8`. */
  alto?: string
  /** Ancho, como utilidad: `w-full`, `w-3/4`. */
  ancho?: string
  className?: string
}

export function Esqueleto({ alto = 'h-4', ancho = 'w-full', className = '' }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-sm bg-bg-muted motion-reduce:animate-none ${alto} ${ancho} ${className}`.trimEnd()}
    />
  )
}

/**
 * El bloque que imita una tarjeta de nota: foto, volanta, título y firma.
 *
 * Imita la forma real y no un rectángulo genérico, que es lo que evita el salto
 * cuando llega el contenido: si el hueco mide parecido a lo que viene, la
 * página no se reacomoda delante de los ojos.
 */
export function EsqueletoTarjeta() {
  return (
    <div className="flex flex-col gap-3">
      <Esqueleto alto="aspect-[16/10] h-auto" />
      <Esqueleto alto="h-3" ancho="w-24" />
      <Esqueleto alto="h-6" />
      <Esqueleto alto="h-6" ancho="w-4/5" />
      <Esqueleto alto="h-3" ancho="w-32" />
    </div>
  )
}
