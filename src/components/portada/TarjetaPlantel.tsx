import Link from 'next/link'

/**
 * El bloque verde que invita al plantel, al costado del listado de análisis.
 *
 * **Las caras y las estadísticas son props opcionales, y la portada no se las
 * pasa.** El boceto las muestra con números puestos a mano —24 jugadoras, 19
 * goles, 3° en la tabla— y eso es dato deportivo: sale de `plantel`,
 * `estadisticas_jugadora` y `tabla_posiciones`, que hoy no existen cargadas.
 * Inventarlos viola la regla no negociable 1. Cuando el Step 12 cargue la
 * temporada, se le pasan y el bloque queda igual al boceto; mientras tanto se
 * dibuja sin ellos, que es un bloque válido y no un hueco.
 *
 * Se puede ver completo, con datos falsos, en `/demo/portada`.
 */
interface Cara {
  id: string
  fotoUrl: string | null
  /** Lo que se dibuja si no hay foto: el dorsal, o "+16" en la última. */
  etiqueta: string
}

interface Estadistica {
  valor: string
  etiqueta: string
}

interface Props {
  titulo: string
  descripcion: string
  enlace: { href: string; texto: string }
  caras?: readonly Cara[]
  estadisticas?: readonly Estadistica[]
}

export function TarjetaPlantel({
  titulo,
  descripcion,
  enlace,
  caras,
  estadisticas,
}: Props) {
  return (
    <aside className="bg-verde-900 p-7 text-white">
      <h2 className="marca text-[1.6rem] uppercase">{titulo}</h2>

      <p className="mt-[0.6rem] font-body text-[0.95rem] leading-snug text-white/75">
        {descripcion}
      </p>

      {caras && caras.length > 0 && (
        <ul className="mt-5 grid grid-cols-4 gap-2">
          {caras.map((cara) => (
            <li
              key={cara.id}
              className="dato flex aspect-square items-center justify-center bg-verde-600/25 text-[0.7rem] text-white/70"
              style={
                cara.fotoUrl
                  ? {
                      backgroundImage: `url(${cara.fotoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {!cara.fotoUrl && cara.etiqueta}
            </li>
          ))}
        </ul>
      )}

      {estadisticas && estadisticas.length > 0 && (
        <dl className="mt-5 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/20 pt-4">
          {estadisticas.map((dato) => (
            // `flex-col-reverse`: en un <dl> el <dt> va antes que su <dd>, pero
            // acá el número se lee arriba y la etiqueta abajo. El orden del DOM
            // queda correcto y el visual también.
            <div key={dato.etiqueta} className="flex flex-col-reverse">
              <dt className="dato text-[0.78rem] text-white/60">{dato.etiqueta}</dt>
              <dd className="marca text-[1.9rem] text-amarillo">{dato.valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* El texto del botón va en `negro-cancha` y no en `tinta`: sobre el
          amarillo, `tinta` en tema oscuro es casi blanco y da 1.95:1.
          `negro-cancha` pasa en los dos (8.02:1 claro, 9.61:1 oscuro). */}
      <Link
        href={enlace.href}
        className="tactil mt-6 inline-flex items-center bg-amarillo px-[1.1rem] font-display text-[0.9rem] font-extrabold text-negro-cancha hover:bg-amarillo/90"
      >
        {enlace.texto}
      </Link>
    </aside>
  )
}
