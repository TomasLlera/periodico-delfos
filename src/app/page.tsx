import type { Metadata } from 'next'
import { BarraEstado } from '@/components/layout/BarraEstado'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { BloqueArchivo } from '@/components/portada/BloqueArchivo'
import { FechaAFecha } from '@/components/portada/FechaAFecha'
import { Goleadoras } from '@/components/portada/Goleadoras'
import { GrillaNotas } from '@/components/portada/GrillaNotas'
import { ListaAnalisis } from '@/components/portada/ListaAnalisis'
import { NotaTapa } from '@/components/portada/NotaTapa'
import { TarjetaPlantel } from '@/components/portada/TarjetaPlantel'
import { getNotaPrincipal, getUltimasNotas } from '@/lib/supabase/queries/notas'
import {
  getPartidosTemporada,
  getProximoPartido,
  getUltimoPartido,
} from '@/lib/supabase/queries/partidos'
import {
  getGoleadoras,
  getPosicionAldosivi,
  getTemporadaActiva,
} from '@/lib/supabase/queries/temporadas'
import { haySupabase } from '@/lib/supabase/server'
import type {
  FilaTablaConEquipo,
  Goleadora,
  NotaResumen,
  PartidoConEquipos,
  Temporada,
} from '@/types'

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
 * **Los tres widgets deportivos ya están puestos** —`<BarraEstado />`,
 * `<FechaAFecha />` y `<Goleadoras />`, los puntos 1, 4 y 5 del blueprint 7.2—
 * y los tres se dibujan sólo si la base tiene con qué. Hoy no hay proyecto de
 * Supabase, así que `leerDeportivo()` devuelve todo vacío y los tres se
 * borran solos: en la ruta pública no aparece ni un marcador inventado (regla
 * no negociable 1). Para verlos dibujados hay que ir a `/demo/portada`.
 *
 * El bloque de plantel sigue sin sus caras ni sus estadísticas por la misma
 * razón. Y el newsletter no está en el Build Order: no se decidió si es un
 * step o una maqueta.
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

interface Deportivo {
  temporada: Temporada | null
  ultimo: PartidoConEquipos | null
  proximo: PartidoConEquipos | null
  posicion: FilaTablaConEquipo | null
  fixture: PartidoConEquipos[]
  goleadoras: Goleadora[]
}

const SIN_DATOS_DEPORTIVOS: Deportivo = {
  temporada: null,
  ultimo: null,
  proximo: null,
  posicion: null,
  fixture: [],
  goleadoras: [],
}

/**
 * Lo que alimenta a los tres widgets deportivos.
 *
 * Las cinco consultas van en paralelo: a diferencia de las notas, ninguna
 * depende del resultado de otra, y en serie serían cinco viajes a la base
 * encadenados en el render de la portada. Lo único que va antes es la
 * temporada activa, porque tres de las cinco necesitan su id.
 *
 * Sin temporada activa quedan el último resultado y el próximo partido, que no
 * dependen de ninguna: la barra se dibuja con lo que haya.
 */
async function leerDeportivo(): Promise<Deportivo> {
  if (!haySupabase()) return SIN_DATOS_DEPORTIVOS

  const temporada = await getTemporadaActiva()

  const [ultimo, proximo, posicion, fixture, goleadoras] = await Promise.all([
    getUltimoPartido(),
    getProximoPartido(),
    temporada ? getPosicionAldosivi(temporada.id) : null,
    temporada ? getPartidosTemporada(temporada.id) : [],
    temporada ? getGoleadoras(temporada.id, 5) : [],
  ])

  return { temporada, ultimo, proximo, posicion, fixture, goleadoras }
}

export default async function Portada() {
  const [{ tapa, cronicas, analisis }, deportivo] = await Promise.all([
    leerContenido(),
    leerDeportivo(),
  ])

  return (
    <>
      <BarraEstado
        ultimo={deportivo.ultimo}
        proximo={deportivo.proximo}
        posicion={deportivo.posicion}
        temporada={deportivo.temporada}
      />

      <Header />

      <main className="mx-auto max-w-[1200px] px-4 pb-4">
        {/* El `<h1>` de la portada es el titular de la nota de tapa. Sin base no
            hay tapa, y la página se quedaba sin ningún `<h1>`: para un lector
            de pantalla, una página sin título. El estado vacío pone el suyo,
            así que la portada tiene exactamente uno en los dos casos. */}
        {tapa ? (
          <NotaTapa nota={tapa} />
        ) : (
          <div className="mt-8 border-l-4 border-verde-600 bg-papel-alt py-6 pl-5">
            <h1 className="marca text-[1.6rem] uppercase">Periódico Delfos</h1>
            <p className="mt-2 max-w-medida font-body text-gris">
              Todavía no hay ninguna nota publicada. La primera que se publique
              abre la portada.
            </p>
          </div>
        )}

        <GrillaNotas
          id="cronicas"
          titulo="Crónicas"
          notas={cronicas}
          enlace={{ href: '/cronicas', texto: 'Todas las crónicas' }}
          vacio="Todavía no hay crónicas publicadas. Las de cada fecha aparecen acá apenas salen."
        />

        <FechaAFecha partidos={deportivo.fixture} temporada={deportivo.temporada} />

        <div className="mt-14 grid gap-12 lg:grid-cols-[2fr_1fr]">
          <ListaAnalisis
            id="analisis"
            titulo="Análisis"
            notas={analisis}
            enlace={{ href: '/analisis', texto: 'Ver más' }}
            vacio="Todavía no hay análisis publicados."
          />

          <div>
            <TarjetaPlantel
              titulo="El plantel"
              descripcion="Fichas, estadísticas y trayectoria de cada una de las jugadoras de Aldosivi."
              enlace={{ href: '/plantel', texto: 'Ver el plantel completo' }}
            />

            <Goleadoras
              goleadoras={deportivo.goleadoras}
              temporada={deportivo.temporada}
            />
          </div>
        </div>

        <BloqueArchivo />
      </main>

      <Footer />
    </>
  )
}
