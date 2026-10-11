import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Aviso } from '@/components/admin/Aviso'
import { GraficoVisitas } from '@/components/admin/GraficoVisitas'
import { TopDeVisitas } from '@/components/admin/TopDeVisitas'
import {
  filasTop,
  nombreDeRuta,
  rangoPedido,
  serieDiaria,
  slugDeNota,
  totalesDelRango,
  RANGOS,
} from '@/lib/estadisticas'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { getTitulosPorSlugs } from '@/lib/supabase/queries/notas'
import { consultarVisitas, hayCredenciales } from '@/lib/vercel-analytics'

/**
 * Las visitas del sitio, desde la API de Web Analytics de Vercel.
 *
 * **Todo se consulta en el servidor.** `VERCEL_TOKEN` es un token de cuenta
 * —con él se pueden tocar todos los proyectos, no sólo éste— y nunca sale de
 * acá: ver `lib/vercel-analytics.ts`, que además importa `server-only` para que
 * el build falle si alguien lo arrastra al navegador.
 *
 * **Las cinco consultas van en paralelo.** Son cinco viajes a una API de
 * terceros: en serie, la pantalla tardaría la suma y no el máximo. Cada
 * respuesta se cachea quince minutos.
 *
 * **El rango vive en la URL y no en un `useState`.** `?rango=30` deja la
 * pantalla compartible y recargable, no manda JavaScript para un selector de
 * dos opciones, y hace que las dos vistas se cacheen por separado. El costo es
 * que la ruta es dinámica, que en el panel es lo que corresponde.
 *
 * **El guard es el mismo del resto del panel**: sin fila en `autores` no se
 * entra. No es `soloEditor`: saber cuánta gente lee lo que uno escribe no es
 * una tarea de administración.
 */
export const metadata: Metadata = { title: 'Estadísticas' }
export const dynamic = 'force-dynamic'

type Params = { searchParams: Promise<{ rango?: string | string[] }> }

export default async function Estadisticas({ searchParams }: Params) {
  const autor = await getAutorDeLaSesion()
  if (!autor) redirect('/admin/login')

  const rango = rangoPedido((await searchParams).rango)

  if (!hayCredenciales()) {
    return (
      <Pantalla rango={rango}>
        <Aviso tono="atencion">
          Faltan las variables en el servidor: <strong>VERCEL_TOKEN</strong> y{' '}
          <strong>VERCEL_PROJECT_ID</strong>, más <strong>VERCEL_TEAM_ID</strong> si
          el proyecto es de un equipo. Van en Vercel → Settings → Environment
          Variables, <strong>sin</strong> el prefijo <code>NEXT_PUBLIC_</code>: son
          secretas y no pueden llegar al navegador.
        </Aviso>
      </Pantalla>
    )
  }

  // Las cinco en paralelo: cinco viajes a una API de terceros, uno tras otro,
  // serían la suma de las cinco esperas en vez de la más larga.
  const [dias, paginas, referentes, dispositivos, paises] = await Promise.all([
    consultarVisitas('day', rango),
    consultarVisitas('requestPath', rango, 10),
    consultarVisitas('referrerHostname', rango, 10),
    consultarVisitas('deviceType', rango),
    consultarVisitas('country', rango, 10),
  ])

  const error = [dias, paginas, referentes, dispositivos, paises].find((r) => r.error)?.error

  if (error) {
    return (
      <Pantalla rango={rango}>
        <Aviso tono="error">
          {error} Si dice 403, suele ser el <strong>VERCEL_TEAM_ID</strong>: va sólo
          si el proyecto pertenece a un equipo, y sobra si es personal.
        </Aviso>
      </Pantalla>
    )
  }

  const serie = serieDiaria(dias.filas)
  const totales = totalesDelRango(serie)
  const topPaginas = filasTop(paginas.filas, 'requestPath')

  // El título de verdad en vez de la URL. Una sola consulta para las diez.
  const titulos = await getTitulosPorSlugs(
    topPaginas.map((fila) => slugDeNota(fila.clave)).filter((slug): slug is string => slug !== null),
  )

  if (totales.vistas === 0) {
    return (
      <Pantalla rango={rango}>
        <Aviso>
          Todavía no hay visitas registradas en este rango. Si Web Analytics se
          acaba de prender, los primeros datos tardan unos minutos en aparecer y
          sólo se cuentan las visitas al sitio publicado, no las de desarrollo.
        </Aviso>
      </Pantalla>
    )
  }

  return (
    <Pantalla rango={rango}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Total numero={totales.vistas} etiqueta="Páginas vistas" />
        <Total
          numero={totales.visitantes}
          etiqueta="Visitantes"
          nota="Sumados por día: quien volvió otro día cuenta dos veces."
        />
      </div>

      <GraficoVisitas serie={serie} />

      <div className="grid gap-8 lg:grid-cols-2">
        <TopDeVisitas
          titulo="Lo más leído"
          filas={topPaginas}
          etiqueta={(ruta) => {
            const slug = slugDeNota(ruta)
            return (slug && titulos.get(slug)) || nombreDeRuta(ruta)
          }}
          vacio="Sin páginas registradas todavía."
        />

        <TopDeVisitas
          titulo="De dónde llegan"
          filas={filasTop(referentes.filas, 'referrerHostname')}
          vacio="Nadie llegó desde otro sitio: todas las visitas fueron directas."
        />

        <TopDeVisitas
          titulo="Con qué entran"
          filas={filasTop(dispositivos.filas, 'deviceType')}
          vacio="Sin datos de dispositivo."
        />

        <TopDeVisitas
          titulo="Desde dónde"
          filas={filasTop(paises.filas, 'country')}
          vacio="Sin datos de país."
        />
      </div>
    </Pantalla>
  )
}

/**
 * El marco: título, selector de rango y lo que sea que haya adentro.
 *
 * Está acá y no en un archivo aparte porque sólo lo usa esta pantalla, y
 * tenerlo al lado hace evidente que los cuatro estados —sin credenciales, con
 * error, sin datos y con datos— comparten exactamente el mismo encabezado.
 */
function Pantalla({ rango, children }: { rango: number; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="titular text-[1.6rem]">Estadísticas</h1>

        {/* Links y no botones: el rango es la URL. Andan sin JavaScript y se
            pueden compartir. */}
        <nav aria-label="Rango de fechas" className="ml-auto flex items-center gap-1">
          {RANGOS.map((dias) => (
            <Link
              key={dias}
              href={`/admin/estadisticas?rango=${dias}`}
              aria-current={rango === dias ? 'page' : undefined}
              className={`tactil flex items-center px-3 font-display text-[0.85rem] font-bold ${
                rango === dias ? 'bg-text text-bg' : 'border border-border-control hover:bg-bg-muted'
              }`}
            >
              {dias} días
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </main>
  )
}

function Total({
  numero,
  etiqueta,
  nota,
}: {
  numero: number
  etiqueta: string
  nota?: string
}) {
  return (
    <div className="border border-border bg-bg-elevated p-5">
      <p className="dato text-[2rem] leading-none font-bold">{numero.toLocaleString('es-AR')}</p>
      <p className="meta mt-2">{etiqueta}</p>
      {nota && <p className="mt-1 text-[0.8rem] text-text-muted">{nota}</p>}
    </div>
  )
}
