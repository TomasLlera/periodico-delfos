import Link from 'next/link'
import { fechaHoraPartido, rival } from '@/lib/formato'
import { ETIQUETA_ESTADO, ladosDelPartido, tituloAccesible } from '@/lib/partido'
import { textoPosicion } from '@/lib/portada'
import type { FilaTablaConEquipo, PartidoConEquipos, Temporada } from '@/types'

/**
 * La tira de datos de arriba de la cabecera: último resultado, próximo partido
 * y posición en la tabla. Es el punto 1 de la portada del blueprint (7.2) y la
 * barra que los dos bocetos tienen pegada arriba del header.
 *
 * **Todo sale de la base y nada se inventa.** Cada una de las tres piezas es
 * opcional y la barra dibuja las que haya; si no hay ninguna —que es lo que
 * pasa hoy, sin proyecto de Supabase— no se dibuja nada. Un espacio vacío
 * arriba del header es peor que no tener la barra, y un marcador de ejemplo
 * en la ruta pública viola la regla no negociable 1. Se puede ver con datos
 * falsos en `/demo/portada`.
 *
 * El texto va en blanco sobre `negro-cancha`, que es una superficie oscura en
 * los dos temas: acá el color lo manda el fondo y no el tema (blanco al 70%
 * da 8.47:1 en claro y 9.6:1 en oscuro; el amarillo, 8.02:1 y 9.61:1).
 */
interface Props {
  ultimo: PartidoConEquipos | null
  proximo: PartidoConEquipos | null
  posicion: FilaTablaConEquipo | null
  /** Para el link a la tabla. Sin temporada, la posición va como texto. */
  temporada?: Temporada | null
}

export function BarraEstado({ ultimo, proximo, posicion, temporada = null }: Props) {
  if (!ultimo && !proximo && !posicion) return null

  return (
    <aside aria-label="La temporada, de un vistazo" className="bg-negro-cancha text-white">
      {/* El scroll horizontal vive acá adentro, contenido por el ancho del
          sitio: en mobile los tres datos no entran en una línea y partirlos en
          tres renglones empuja la cabecera fuera de la primera pantalla.

          **`relative` no es decorativo.** Adentro hay `sr-only`, que es
          `position: absolute`, y un absoluto se mide contra su ancestro
          posicionado: sin este `relative` su ancestro es el documento y el
          `overflow-x` de acá no lo contiene. Cada uno de esos spans estira la
          página entera —375 de viewport, 1180 de documento— sin que se vea
          nada raro en la captura. */}
      <div className="relative mx-auto flex max-w-[1200px] items-center gap-4 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ultimo && <Ultimo partido={ultimo} />}

        {ultimo && (proximo || posicion) && <Separador />}

        {proximo && <Proximo partido={proximo} />}

        {proximo && posicion && <Separador />}

        {posicion && <Posicion fila={posicion} temporada={temporada} />}
      </div>
    </aside>
  )
}

function Separador() {
  return (
    <span aria-hidden="true" className="shrink-0 text-white/25">
      |
    </span>
  )
}

/** El marcador va en la chapita amarilla del boceto, con el resto en blanco. */
function Ultimo({ partido }: { partido: PartidoConEquipos }) {
  const lados = ladosDelPartido(partido)
  const hayResultado = lados.golesIzquierda !== null && lados.golesDerecha !== null

  return (
    <Link href={`/partido/${partido.slug}`} className="group shrink-0 whitespace-nowrap">
      <span className="sr-only">Último partido. {tituloAccesible(partido)}</span>

      <span aria-hidden="true" className="dato flex items-center gap-2 text-[0.78rem]">
        <span className="text-white/70 group-hover:text-white">
          {lados.izquierda.nombre_corto}
        </span>

        {hayResultado ? (
          <span className="bg-amarillo px-[0.45rem] py-[0.1rem] font-medium text-negro-cancha">
            {lados.golesIzquierda}-{lados.golesDerecha}
          </span>
        ) : (
          <span className="text-white/50">vs</span>
        )}

        <span className="text-white/70 group-hover:text-white">
          {lados.derecha.nombre_corto}
        </span>

        {partido.estado !== 'finalizado' && (
          <span className="text-amarillo">{ETIQUETA_ESTADO[partido.estado]}</span>
        )}
      </span>
    </Link>
  )
}

/**
 * El próximo partido dice cuándo y dónde, que es lo que el lector busca. La
 * cancha se omite cuando no está cargada en lugar de escribir "a confirmar":
 * la base guarda null, no una promesa.
 */
function Proximo({ partido }: { partido: PartidoConEquipos }) {
  const contra = rival(partido)
  const deLocal = partido.equipo_local.es_aldosivi

  const partes = [
    `${deLocal ? 'vs.' : 'visita a'} ${contra.nombre_corto}`,
    fechaHoraPartido(partido.fecha_hora),
    partido.cancha,
  ].filter((parte): parte is string => Boolean(parte))

  return (
    <Link href={`/partido/${partido.slug}`} className="group shrink-0 whitespace-nowrap">
      <span className="sr-only">Próximo partido. {tituloAccesible(partido)}</span>

      <span aria-hidden="true" className="dato text-[0.78rem] text-white/70 group-hover:text-white">
        <span className="text-amarillo">Próximo</span> · {partes.join(' · ')}
      </span>
    </Link>
  )
}

function Posicion({
  fila,
  temporada,
}: {
  fila: FilaTablaConEquipo
  temporada: Temporada | null
}) {
  const texto = textoPosicion(fila)

  const contenido = (
    <>
      <span className="text-amarillo">Tabla</span> · {texto}
    </>
  )

  if (!temporada) {
    return (
      <p className="dato shrink-0 whitespace-nowrap text-[0.78rem] text-white/70">
        {contenido}
      </p>
    )
  }

  return (
    <Link
      href={`/temporada/${temporada.slug}?ver=tabla`}
      className="dato shrink-0 whitespace-nowrap text-[0.78rem] text-white/70 hover:text-white"
    >
      <span className="sr-only">
        Aldosivi va {texto} en {temporada.nombre}. Ver la tabla de posiciones.
      </span>
      <span aria-hidden="true">{contenido}</span>
    </Link>
  )
}
