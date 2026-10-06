import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { redesDelMedio } from '@/lib/redes-del-medio'
import { openGraphBase } from '@/lib/seo'
import { MAIL_DEL_MEDIO, urlDelSitio } from '@/lib/sitio'
import { getPagina } from '@/lib/supabase/queries/paginas'
import { CuerpoTipTap } from '@/lib/tiptap/render'

/**
 * Contacto.
 *
 * **El texto lo edita Charlie desde el panel** (`/admin/paginas/contacto`),
 * igual que "Quiénes somos". Lo que no es editable son el mail y la lista de
 * cuentas, y eso es una decisión:
 *
 * - El mail sale de `MAIL_DEL_MEDIO`, la misma constante que cita la política de
 *   privacidad. Si viviera además como texto adentro del cuerpo, el día que
 *   cambie habría que acordarse de los dos lugares, y el que se olvide deja una
 *   dirección muerta en un documento legal.
 * - Las cuentas salen de `redesDelMedio()`, que lee el entorno: las mismas que
 *   la tira de arriba y el pie.
 *
 * Las dos se dibujan alrededor del texto editable. Charlie escribe lo que hay
 * que escribir y los datos se mantienen solos.
 *
 * **No tiene formulario, a propósito.** Un formulario necesita a dónde mandar el
 * mail, un servicio que lo mande y, si guarda lo que escribe la gente, aparecer
 * en la política de privacidad. Un `mailto:` no necesita nada de eso.
 */
export const revalidate = 60

const SLUG = 'contacto'
const SITE_URL = urlDelSitio()

/** Lo mínimo cierto, para la ventana entre el deploy y la migración. */
const RESPALDO = {
  titulo: 'Contacto',
  descripcion: `Escribile a Periódico Delfos: ${MAIL_DEL_MEDIO}. Datos, correcciones y lo que falte sobre el fútbol femenino de Aldosivi.`,
}

export async function generateMetadata(): Promise<Metadata> {
  const pagina = await getPagina(SLUG)
  const titulo = pagina?.titulo ?? RESPALDO.titulo
  const descripcion = pagina?.descripcion ?? RESPALDO.descripcion

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `${SITE_URL}/${SLUG}` },
    openGraph: { ...openGraphBase({ titulo, descripcion }, SITE_URL), type: 'website' },
  }
}

export default async function Contacto() {
  const [pagina, redes] = [await getPagina(SLUG), redesDelMedio()]

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <CabeceraBloque id={SLUG} titulo={pagina?.titulo ?? RESPALDO.titulo} nivel={1} />

        {/* El mail, arriba de todo y fuera del texto editable: es lo que la
            mayoría vino a buscar y no tiene que depender de que alguien se
            acuerde de escribirlo. */}
        <div className="prose-nota">
          <p>
            La forma más directa de llegar al medio es el mail:{' '}
            <a href={`mailto:${MAIL_DEL_MEDIO}`}>{MAIL_DEL_MEDIO}</a>.
          </p>
        </div>

        {pagina && <CuerpoTipTap cuerpo={pagina.cuerpo} className="mt-6" />}

        {redes.length > 0 && (
          <div className="prose-nota mt-6">
            <h2>En las redes</h2>

            <p>Las cuentas del medio, por si es más cómodo escribir por ahí:</p>

            <ul>
              {redes.map((red) => (
                <li key={red.clave}>
                  {/* `me` además de `noopener`: le dice a los verificadores de
                      identidad que esa cuenta es de este mismo sitio. Es el
                      mismo rel que usan los íconos de la tira de arriba. */}
                  <a href={red.url} target="_blank" rel="noopener noreferrer me">
                    {red.etiqueta}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
