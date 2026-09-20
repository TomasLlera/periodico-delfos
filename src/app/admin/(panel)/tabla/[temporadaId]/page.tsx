import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditorTabla } from '@/components/admin/EditorTabla'
import { fechaSugerida } from '@/lib/entidades/tabla'
import { getEquipos } from '@/lib/supabase/queries/equipos'
import {
  getFechasConTabla,
  getTablaPosiciones,
  getTemporadaPorId,
} from '@/lib/supabase/queries/temporadas'

/**
 * La tabla de posiciones de una fecha.
 *
 * Qué fecha se edita va en la URL como `?fecha=`, no en un estado del cliente:
 * así se puede volver a una fecha vieja desde el historial, compartir el link y
 * recargar sin perder dónde se estaba. Sin el parámetro, abre en la siguiente a
 * la última cargada, que es la que toca casi siempre.
 */
export const dynamic = 'force-dynamic'

type Params = {
  params: Promise<{ temporadaId: string }>
  searchParams: Promise<{ fecha?: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const temporada = await getTemporadaPorId((await params).temporadaId)
  return { title: temporada ? `Tabla · ${temporada.nombre}` : 'Tabla' }
}

export default async function Tabla({ params, searchParams }: Params) {
  const { temporadaId } = await params
  const { fecha: fechaCruda } = await searchParams

  const temporada = await getTemporadaPorId(temporadaId)
  if (!temporada) notFound()

  const [cargadas, equipos] = await Promise.all([
    getFechasConTabla(temporadaId),
    getEquipos(),
  ])

  // `?fecha=` es entrada de usuario: cualquier cosa que no sea un número cae en
  // la sugerida en lugar de romper la página.
  const pedida = Number(fechaCruda)
  const fecha =
    Number.isInteger(pedida) && pedida > 0
      ? pedida
      : fechaSugerida(cargadas.map((f) => ({ fecha_numero: f })))

  const { filas } = await getTablaPosiciones(temporadaId, fecha)

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <h1 className="titular mb-1 text-[1.4rem]">Tabla de posiciones</h1>
      <p className="meta mb-5 text-gris">
        {temporada.nombre} · fecha {fecha}
      </p>

      {cargadas.length > 0 && (
        <nav aria-label="Fechas ya cargadas" className="mb-5 flex flex-wrap items-center gap-2">
          <span className="meta text-gris">Ya cargadas:</span>
          {cargadas.map((numero) => (
            <Link
              key={numero}
              href={`/admin/tabla/${temporadaId}?fecha=${numero}`}
              aria-current={numero === fecha ? 'page' : undefined}
              className={
                'tactil flex items-center px-3 font-display text-[0.85rem] font-bold ' +
                (numero === fecha
                  ? 'bg-verde-900 text-white'
                  : 'border border-linea-fuerte hover:bg-papel-alt')
              }
            >
              {numero}
            </Link>
          ))}
        </nav>
      )}

      <EditorTabla
        key={fecha}
        temporadaId={temporadaId}
        fechaNumero={fecha}
        equipos={equipos}
        filasGuardadas={filas}
      />
    </main>
  )
}
