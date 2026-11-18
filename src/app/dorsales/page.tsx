import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SinTemporada } from '@/components/layout/SinTemporada'
import { getTemporadasEstatico } from '@/lib/supabase/queries/temporadas'
import { haySupabase } from '@/lib/supabase/server'

/**
 * La puerta de la sección: elegir el campeonato.
 *
 * **Acá no hay redirect a la temporada en curso**, al revés que `/plantel` y
 * `/fixture`, y es a propósito. Esas dos contestan "cómo va esto ahora", que
 * siempre es la temporada activa. Ésta contesta "con qué número jugó Fulana en
 * tal campeonato", que es una pregunta de archivo: elegir el año es parte de
 * la pregunta, y es como la pidió Carlos —entrar a dorsales y elegir
 * "Primera B 2026"—.
 *
 * Con una sola temporada cargada se ve una sola tarjeta, que es correcto y no
 * tiene por qué saltearse: el día que haya cuatro, la pantalla ya es la misma.
 */
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Dorsales',
  description:
    'Con qué número jugó cada jugadora de Aldosivi en cada campeonato, partido por partido.',
}

export default async function Dorsales() {
  const temporadas = haySupabase() ? await getTemporadasEstatico() : []

  if (temporadas.length === 0) {
    return (
      <>
        <Header />
        <SinTemporada
          titulo="Dorsales"
          explicacion="Todavía no hay ningún campeonato cargado. Cuando lo haya, acá va el número que usó cada jugadora en cada partido, y cuántas veces usó cada uno."
        />
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="contenedor py-10">
        <div className="border-b-[3px] border-border-strong pb-3">
          <p className="meta">Fútbol femenino de Aldosivi</p>
          <h1 className="marca mt-1 text-[1.8rem] uppercase md:text-[2.3rem]">Dorsales</h1>
        </div>

        <p className="max-w-medida mt-6 font-body text-[1.05rem] leading-relaxed text-text-soft">
          El número no es del año sino de cada partido: una jugadora puede salir con el 9 en
          marzo y con el 11 en agosto. Elegí un campeonato y vas a ver qué números usó cada una
          y en cuántos partidos llevó cada uno.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {temporadas.map((temporada) => (
            <li key={temporada.id}>
              <Link
                href={`/dorsales/${temporada.slug}`}
                className="tactil flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border border-border bg-bg-elevated px-4 py-4 hover:border-accent"
              >
                <span className="titular text-[1.1rem]">{temporada.nombre}</span>
                <span className="meta text-text-muted">
                  {temporada.activa ? 'En curso' : `${temporada.anio}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <Footer />
    </>
  )
}
