import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { openGraphBase } from '@/lib/seo'
import { urlDelSitio } from '@/lib/sitio'
import { getPagina } from '@/lib/supabase/queries/paginas'
import { CuerpoTipTap } from '@/lib/tiptap/render'

/**
 * Quiénes somos.
 *
 * **El texto ya no vive en este archivo: lo escribe Charlie desde el panel.**
 * Hasta el 06/10/2026 estaba acá adentro, así que corregir una coma era un
 * commit, un PR y un deploy. Ahora sale de la tabla `paginas` y se edita en
 * `/admin/paginas/quienes-somos`.
 *
 * **Se dibuja con el mismo renderer que el cuerpo de una nota** (`CuerpoTipTap`),
 * porque se guarda con el mismo formato. Nada de un segundo camino para la misma
 * clase de contenido: lo que se ve acá es lo que se ve en una crónica.
 *
 * **El respaldo no es decorativo.** Entre que se despliega este código y se
 * aplica la migración hay una ventana donde la tabla no existe, y esta página
 * está linkeada desde el pie de todo el sitio: no puede quedar en blanco ni
 * tirar un 500. En esa ventana se muestra lo mínimo cierto, que es quién es el
 * medio, y nada más.
 *
 * `revalidate` de 60 segundos como el resto del sitio, más el `revalidatePath`
 * que hace el action al guardar: un cambio se ve enseguida y no cada minuto.
 */
export const revalidate = 60

const SLUG = 'quienes-somos'
const SITE_URL = urlDelSitio()

/** Lo que se muestra si la tabla todavía no está. Ver el comentario de arriba. */
const RESPALDO = {
  titulo: 'Quiénes somos',
  descripcion:
    'Periódico Delfos cubre el fútbol femenino de Aldosivi desde Mar del Plata. Lo escribe Charlie Redondo.',
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

export default async function QuienesSomos() {
  const pagina = await getPagina(SLUG)

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <CabeceraBloque
          id={SLUG}
          titulo={pagina?.titulo ?? RESPALDO.titulo}
          nivel={1}
        />

        {pagina ? (
          <CuerpoTipTap cuerpo={pagina.cuerpo} />
        ) : (
          <div className="prose-nota">
            <p>{RESPALDO.descripcion}</p>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
