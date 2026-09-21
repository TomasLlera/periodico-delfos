import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { openGraphBase } from '@/lib/seo'

/**
 * Quiénes somos. Step 10 del Build Order.
 *
 * **Todo lo que dice acá sale de lo que ya está escrito en el proyecto** —el
 * README, `CLAUDE.md` y el blueprint— y nada está inventado: el medio, la
 * ciudad, el equipo que cubre y que lo escribe una sola persona. Lo que
 * corresponde y falta es lo que sólo puede escribir el autor: desde cuándo
 * existe el medio, por qué lo empezó y su biografía. Está anotado en
 * `HANDOFF.md`; mientras tanto la página dice lo cierto y no rellena.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const DESCRIPCION =
  'Periódico Delfos cubre el fútbol femenino de Aldosivi desde Mar del Plata. Lo escribe Charlie Redondo.'

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description: DESCRIPCION,
  alternates: { canonical: `${SITE_URL}/quienes-somos` },
  openGraph: {
    ...openGraphBase({ titulo: 'Quiénes somos', descripcion: DESCRIPCION }, SITE_URL),
    type: 'website',
  },
}

export default function QuienesSomos() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <CabeceraBloque id="quienes-somos" titulo="Quiénes somos" nivel={1} />

        <div className="prose-nota">
          <p>
            <strong>Periódico Delfos</strong> es un medio digital de Mar del
            Plata dedicado al fútbol femenino de Aldosivi. Cubre a las Tiburonas
            fecha a fecha: la crónica de cada partido, los análisis del torneo y
            las estadísticas de la temporada.
          </p>

          <h2>Cómo se trabaja acá</h2>

          <p>
            Lo escribe una sola persona, <strong>Charlie Redondo</strong>. Eso
            define el tamaño de lo que se publica y también su ritmo: no hay
            cobertura minuto a minuto ni contenido de relleno entre fechas.
          </p>

          <p>
            Los datos del partido —goles, formaciones, tarjetas, minutos— no se
            escriben a mano adentro del texto de las notas. Se cargan una sola
            vez en una planilla y de ahí salen la ficha del partido, las
            estadísticas de cada jugadora y la tabla de goleadoras. Es lo que
            permite que una nota de hace dos temporadas siga teniendo los datos
            bien puestos, y que las cifras no se contradigan entre notas.
          </p>

          <p>
            Cada foto publicada lleva su texto alternativo y su crédito. El
            cuerpo de las notas se compone a una medida de lectura fija, pensada
            para leer ochocientas palabras en un teléfono sin cansarse.
          </p>
        </div>
      </main>

      <Footer />
    </>
  )
}
