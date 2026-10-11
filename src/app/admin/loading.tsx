import { Esqueleto } from '@/components/layout/Esqueleto'

/**
 * Lo que se ve mientras carga una pantalla del panel.
 *
 * **Sin la cabecera del panel adentro**, al revés que el `loading` público: la
 * barra del admin la pone el layout del grupo `(panel)`, así que durante la
 * carga sigue dibujada y con el link de la sección a la que se está yendo. Sólo
 * falta el cuerpo, que es lo que esto ocupa.
 *
 * Cubre también `/admin/login`, que está afuera de ese grupo: ahí se ve el
 * esqueleto sin barra, que es exactamente lo que corresponde.
 *
 * **La forma es la de un listado** —título, una línea de ayuda y filas— porque
 * es la forma de casi todas las pantallas del panel: notas, partidos,
 * jugadoras, equipos, temporadas, sponsors, autores y páginas. Las de
 * formulario se van a ver distintas por dentro durante un instante, y mantener
 * ocho esqueletos sincronizados con ocho pantallas cuesta más de lo que ese
 * instante vale.
 */
export default function CargandoPanel() {
  return (
    <main
      role="status"
      aria-label="Cargando la pantalla"
      className="mx-auto max-w-[900px] px-4 py-8"
    >
      <div className="mb-6 flex items-center gap-4">
        <Esqueleto alto="h-8" ancho="w-48" />
        <Esqueleto alto="h-11" ancho="w-36" className="ml-auto" />
      </div>

      <div className="flex flex-col">
        {Array.from({ length: 8 }, (_, indice) => (
          <div key={indice} className="flex items-center gap-3 border-b border-border py-4">
            <Esqueleto alto="h-5" ancho="w-20" />
            <Esqueleto alto="h-5" ancho="w-1/3" />
            <Esqueleto alto="h-4" ancho="w-24" className="ml-auto" />
          </div>
        ))}
      </div>

      <span className="sr-only">Cargando…</span>
    </main>
  )
}
