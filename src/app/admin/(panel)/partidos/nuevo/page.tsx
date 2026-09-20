import type { Metadata } from 'next'
import { Aviso } from '@/components/admin/Aviso'
import { FormularioPartido } from '@/components/admin/FormularioPartido'
import { isoALocal } from '@/lib/entidades/campos'
import { getEquipos } from '@/lib/supabase/queries/equipos'
import { getTemporadaActiva, getTemporadas } from '@/lib/supabase/queries/temporadas'

/**
 * Crear un partido: lo que faltaba para que el panel se sostenga solo.
 *
 * Hasta el Step 12 los partidos entraban por SQL y la planilla —que es el
 * Step 13, construido antes— sólo sabía editar uno que ya existía.
 *
 * Necesita equipos y temporadas cargados, así que si falta alguno de los dos lo
 * dice acá en vez de mostrar dos selects vacíos.
 */
export const metadata: Metadata = { title: 'Partido nuevo' }
export const dynamic = 'force-dynamic'

/**
 * La hora con la que abre el formulario: hoy a las 15:30 de Mar del Plata.
 *
 * Es la hora habitual de un partido de la categoría, y arrancar ahí ahorra
 * girar la rueda del selector en el celular. La conversión pasa por
 * `isoALocal()` para que el huso sea el de siempre y no el del servidor.
 */
function fechaHoraSugerida(): string {
  return `${isoALocal(new Date().toISOString()).slice(0, 10)}T15:30`
}

export default async function PartidoNuevo() {
  const [temporadas, equipos, activa] = await Promise.all([
    getTemporadas(),
    getEquipos(),
    getTemporadaActiva(),
  ])

  const faltan = [
    temporadas.length === 0 ? 'una temporada' : null,
    equipos.length < 2 ? 'al menos dos equipos' : null,
  ].filter(Boolean)

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Partido nuevo</h1>

      {faltan.length > 0 && (
        <div className="mb-5">
          <Aviso tono="atencion">
            Antes de cargar un partido falta {faltan.join(' y ')}. Un partido cuelga de una
            temporada y enfrenta a dos equipos: sin eso no hay qué elegir.
          </Aviso>
        </div>
      )}

      <FormularioPartido
        partido={null}
        temporadas={temporadas}
        equipos={equipos}
        fechaHoraInicial={fechaHoraSugerida()}
        temporadaActivaId={activa?.id ?? null}
      />
    </main>
  )
}
