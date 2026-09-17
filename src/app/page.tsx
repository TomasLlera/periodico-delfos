import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { BloqueArchivo } from '@/components/portada/BloqueArchivo'
import { GrillaNotas } from '@/components/portada/GrillaNotas'
import { ListaAnalisis } from '@/components/portada/ListaAnalisis'
import { NotaTapa } from '@/components/portada/NotaTapa'
import { TarjetaPlantel } from '@/components/portada/TarjetaPlantel'
import { getTemperatura } from '@/lib/clima'
import { getNotaPrincipal, getUltimasNotas } from '@/lib/supabase/queries/notas'
import { haySupabase } from '@/lib/supabase/server'
import type { NotaResumen } from '@/types'

/**
 * La portada. Step 9 del Build Order, dibujada según `boceto-portada.html`.
 *
 * Server Component puro de datos: lee y le pasa todo a componentes que no
 * consultan nada. Es lo que permite mirar el diseño con datos falsos en
 * `/demo/portada` mientras no haya base.
 *
 * **Ninguna nota se repite entre bloques**, que es el problema número uno de la
 * home de WordPress: muestra las mismas seis notas cuatro veces (blueprint
 * 7.2). Cada query excluye los ids que ya salieron.
 *
 * **Lo que el boceto trae y acá no está, a propósito:** la barra de resultados
 * de arriba del header, la planilla del último partido, el widget de próximo
 * partido y la tabla de posiciones. Son `<BarraEstado />`, `<FechaAFecha />` y
 * `<Goleadoras />`: los componentes ya existen y se miran en `/demo/widgets`,
 * pero el Build Order los excluye de este step porque todavía no hay datos
 * deportivos, y no se enchufan acá hasta que la base los tenga (Step 19). El
 * bloque de plantel se dibuja sin sus caras ni sus estadísticas por la misma
 * razón. Y el newsletter no está en el Build Order: no se decidió si es un step
 * o una maqueta.
 *
 * ISR 60s (blueprint 7.1). Al publicar, el Server Action además revalida `/`.
 */
export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * El canónico de la portada es la raíz y nada más. Sin esto, cualquier variante
 * con parámetros —los `?fbclid=` que agregan las redes al compartir— se indexa
 * como una página distinta con el mismo contenido.
 */
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
}

interface Contenido {
  tapa: NotaResumen | null
  cronicas: NotaResumen[]
  analisis: NotaResumen[]
}

/**
 * Sin proyecto de Supabase la portada se dibuja vacía, con sus estados
 * escritos, en lugar de reventar el build. Es el mismo criterio que usa
 * `generateStaticParams` en `/nota/[slug]`.
 */
async function leerContenido(): Promise<Contenido> {
  if (!haySupabase()) return { tapa: null, cronicas: [], analisis: [] }

  const tapa = await getNotaPrincipal()
  const yaSalieron = tapa ? [tapa.id] : []

  const cronicas = await getUltimasNotas({
    limite: 5,
    categoria: 'cronica',
    excluirIds: yaSalieron,
  })

  const analisis = await getUltimasNotas({
    limite: 3,
    categoria: 'analisis',
    excluirIds: [...yaSalieron, ...cronicas.map((n) => n.id)],
  })

  return { tapa, cronicas, analisis }
}

export default async function Portada() {
  // Las dos lecturas son independientes: el clima no espera a la base.
  const [{ tapa, cronicas, analisis }, temperatura] = await Promise.all([
    leerContenido(),
    getTemperatura(),
  ])

  return (
    <>
      <Header temperatura={temperatura} />

      <main className="mx-auto max-w-[1200px] px-4 pb-4">
        {tapa ? (
          <NotaTapa nota={tapa} />
        ) : (
          <p className="mt-8 border-l-4 border-verde-600 bg-papel-alt py-6 pl-5 font-body text-gris">
            Todavía no hay ninguna nota publicada. La primera que se publique
            abre la portada.
          </p>
        )}

        <GrillaNotas
          id="cronicas"
          titulo="Crónicas"
          notas={cronicas}
          enlace={{ href: '/cronicas', texto: 'Todas las crónicas' }}
          vacio="Todavía no hay crónicas publicadas. Las de cada fecha aparecen acá apenas salen."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[2fr_1fr]">
          <ListaAnalisis
            id="analisis"
            titulo="Análisis"
            notas={analisis}
            enlace={{ href: '/analisis', texto: 'Ver más' }}
            vacio="Todavía no hay análisis publicados."
          />

          <TarjetaPlantel
            titulo="El plantel"
            descripcion="Fichas, estadísticas y trayectoria de cada una de las jugadoras de Aldosivi."
            enlace={{ href: '/plantel', texto: 'Ver el plantel completo' }}
          />
        </div>

        <BloqueArchivo />
      </main>

      <Footer />
    </>
  )
}
