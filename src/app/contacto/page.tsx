import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { redesDelMedio } from '@/lib/redes-del-medio'
import { openGraphBase } from '@/lib/seo'
import { MAIL_DEL_MEDIO, urlDelSitio } from '@/lib/sitio'

/**
 * Contacto.
 *
 * **La ruta existía en el pie y daba 404**, así que el link se había sacado
 * —ver el comentario de `<Footer />`—. Faltaba un dato que sólo tenía Charlie:
 * a qué dirección quiere que le escriban. Lo pasó el 02/10/2026 y por eso la
 * página existe ahora y no antes.
 *
 * **No inventa nada de lo que no hay.** No hay teléfono, no hay dirección
 * postal y no hay formulario: un formulario necesita a dónde mandar el mail, un
 * servicio que lo mande y, si guarda lo que escribe la gente, aparecer en la
 * política de privacidad. Un `mailto:` no necesita nada de eso y funciona
 * igual. El día que haya volumen para justificar un formulario, se agrega.
 *
 * **Las cuentas salen de `redesDelMedio()`** y no escritas acá: son las mismas
 * que la cabecera y el pie, y si alguna vez cambian, cambian en un solo lugar.
 * Si no hay ninguna cargada, la sección entera no se dibuja.
 */
const SITE_URL = urlDelSitio()

const DESCRIPCION = `Escribile a Periódico Delfos: ${MAIL_DEL_MEDIO}. Datos, correcciones y lo que falte sobre el fútbol femenino de Aldosivi.`

export const metadata: Metadata = {
  title: 'Contacto',
  description: DESCRIPCION,
  alternates: { canonical: `${SITE_URL}/contacto` },
  openGraph: {
    ...openGraphBase({ titulo: 'Contacto', descripcion: DESCRIPCION }, SITE_URL),
    type: 'website',
  },
}

export default function Contacto() {
  const redes = redesDelMedio()

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <CabeceraBloque id="contacto" titulo="Contacto" nivel={1} />

        <div className="prose-nota">
          <p>
            La forma más directa de llegar al medio es el mail:{' '}
            <a href={`mailto:${MAIL_DEL_MEDIO}`}>{MAIL_DEL_MEDIO}</a>.
          </p>

          <h2>Qué conviene mandar por ahí</h2>

          <p>
            <strong>Correcciones.</strong> Si un dato de una nota está mal —un
            gol mal adjudicado, un nombre mal escrito, un minuto cambiado—,
            decilo. Los datos del partido salen de una planilla y corregirlos ahí
            arregla la nota, la ficha del partido y las estadísticas de la
            jugadora de una sola vez, incluso en notas publicadas hace meses.
          </p>

          <p>
            <strong>Datos y fotos de los partidos.</strong> El medio lo escribe
            una sola persona y no llega a todas las canchas. Las formaciones, los
            goles con su minuto y las fotos de las fechas que no se cubrieron son
            bienvenidas, con el crédito de quien las sacó.
          </p>

          <p>
            <strong>Cualquier cosa sobre el fútbol femenino de Aldosivi</strong>{' '}
            que debería estar publicada y no está.
          </p>

          {redes.length > 0 && (
            <>
              <h2>En las redes</h2>

              <p>Las cuentas del medio, por si es más cómodo escribir por ahí:</p>

              <ul>
                {redes.map((red) => (
                  <li key={red.clave}>
                    {/* `me` además de `noopener`: le dice a los verificadores de
                        identidad que esa cuenta es de este mismo sitio. Es el
                        mismo rel que usan los íconos de la cabecera. */}
                    <a href={red.url} target="_blank" rel="noopener noreferrer me">
                      {red.etiqueta}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
