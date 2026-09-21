import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ListadoNotas } from '@/components/listado/ListadoNotas'
import { hrefDePagina } from '@/components/listado/Paginacion'
import { contarPaginas, paginaPedida, POR_PAGINA } from '@/lib/paginacion'
import { openGraphBase } from '@/lib/seo'
import { getNotasPorCategoria } from '@/lib/supabase/queries/notas'
import { haySupabase } from '@/lib/supabase/server'

/**
 * El listado de análisis. Segunda mitad del Step 9 del Build Order.
 *
 * **Es dinámica y no prerenderizada, y es correcto que lo sea:** la página sale
 * de `?pagina=`, y leer `searchParams` saca a la ruta del prerender. El
 * `revalidate` sigue valiendo para el cacheo de los datos.
 *
 * La paginación va por querystring y no por segmento (`/cronicas/pagina/2`)
 * porque el blueprint (7.1) define la ruta como `/cronicas` a secas, y porque
 * las 301 de WordPress ya están escritas contra esa forma.
 */
export const revalidate = 60

const BASE = '/analisis'
const TITULO = 'Análisis'
const DESCRIPCION =
  'Los números, la táctica y las cuentas del torneo, más allá del resultado de la fecha.'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type Params = { searchParams: Promise<{ pagina?: string | string[] }> }

/**
 * Cada página es su propio canónico. Apuntar la 2 a la 1 le dice a un buscador
 * que las notas de la 2 son duplicados de las de la 1, y las saca del índice:
 * es justo lo contrario de lo que hace falta con 70 notas migradas.
 */
export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const pagina = paginaPedida((await searchParams).pagina)
  const titulo = pagina > 1 ? `${TITULO} · página ${pagina}` : TITULO

  return {
    title: titulo,
    description: DESCRIPCION,
    alternates: { canonical: `${SITE_URL}${hrefDePagina(BASE, pagina)}` },
    openGraph: { ...openGraphBase({ titulo, descripcion: DESCRIPCION }, SITE_URL), type: 'website' },
  }
}

export default async function Analisis({ searchParams }: Params) {
  const pagina = paginaPedida((await searchParams).pagina)

  // Sin proyecto de Supabase el listado se dibuja vacío en lugar de reventar.
  const { notas, total } = haySupabase()
    ? await getNotasPorCategoria('analisis', pagina, POR_PAGINA)
    : { notas: [], total: 0 }

  // Una página más allá del final no es una página vacía, es un 404. Si no,
  // `/cronicas?pagina=999` devuelve 200 y entra al índice.
  if (pagina > 1 && notas.length === 0) notFound()

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <ListadoNotas
          id="listado-analisis"
          titulo={TITULO}
          nivel={1}
          descripcion={DESCRIPCION}
          notas={notas}
          base={BASE}
          pagina={pagina}
          totalPaginas={contarPaginas(total)}
          vacio="Todavía no hay análisis publicados."
        />
      </main>

      <Footer />
    </>
  )
}
