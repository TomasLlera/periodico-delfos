import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Aviso } from '@/components/admin/Aviso'
import { GraficoVisitas } from '@/components/admin/GraficoVisitas'
import { PestanasEstadisticas } from '@/components/admin/PestanasEstadisticas'
import { TopDeVisitas } from '@/components/admin/TopDeVisitas'
import {
  filasTop,
  nombreDeRuta,
  PESTANA_ESTADISTICAS_POR_OMISION,
  pestanaDeEstadisticas,
  type PestanaEstadisticas,
  rangoPedido,
  serieDiaria,
  slugDeNota,
  totalesDelRango,
  RANGOS,
} from '@/lib/estadisticas'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { getTitulosPorSlugs } from '@/lib/supabase/queries/notas'
import {
  consultarVisitas,
  hayCredenciales,
  SIN_NOTAS,
  SOLO_NOTAS,
} from '@/lib/vercel-analytics'

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

type Params = {
  searchParams: Promise<{ rango?: string | string[]; ver?: string | string[] }>
}

export default async function Estadisticas({ searchParams }: Params) {
  const autor = await getAutorDeLaSesion()
  if (!autor) redirect('/admin/login')

  const parametros = await searchParams
  const rango = rangoPedido(parametros.rango)
  const pestana = pestanaDeEstadisticas(parametros.ver)

  if (!hayCredenciales()) {
    return (
      <Pantalla rango={rango} pestana={pestana}>
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

  // **Cada pestaña pide sólo lo suyo.** Con las cuatro dibujadas a la vez eran
  // seis viajes a la API en cada carga para mostrar tres listas que nadie
  // estaba mirando. Ahora son dos o tres, y el resto se piden cuando se los
  // pide. Es la misma decisión que toma la página de temporada con sus vistas.
  //
  // Los que quedan sí van en paralelo: en serie, la pantalla tardaría la suma
  // de las esperas en lugar de la más larga.
  const [dias, ...resto] = await Promise.all([
    consultarVisitas('day', rango),
    ...(pestana === 'notas'
      ? // Las notas aparte del resto, que es lo que preguntó Charlie: "qué
        // noticia se leyó más". Mezcladas con la portada y las secciones, la
        // portada gana siempre y la lista no contesta nada.
        [consultarVisitas('requestPath', rango, 10, SOLO_NOTAS)]
      : []),
    ...(pestana === 'secciones' ? [consultarVisitas('requestPath', rango, 10, SIN_NOTAS)] : []),
    ...(pestana === 'origen' ? [consultarVisitas('referrerHostname', rango, 10)] : []),
    ...(pestana === 'publico'
      ? [consultarVisitas('deviceType', rango), consultarVisitas('country', rango, 10)]
      : []),
  ])

  const error = [dias, ...resto].find((r) => r.error)?.error

  if (error) {
    return (
      <Pantalla rango={rango} pestana={pestana}>
        <Aviso tono="error">
          {error} Si dice 403, suele ser el <strong>VERCEL_TEAM_ID</strong>: va sólo
          si el proyecto pertenece a un equipo, y sobra si es personal.
        </Aviso>
      </Pantalla>
    )
  }

  const serie = serieDiaria(dias.filas)
  const totales = totalesDelRango(serie)

  // Las filas de la pestaña que se está mirando. `resto` trae una respuesta, o
  // dos en "Quién mira", que es la única que junta dos listas cortas: una tabla
  // de dos renglones no merece una pestaña propia.
  const [primera, segunda] = resto
  const filasDeLaPestana = filasTop(
    primera?.filas ?? [],
    pestana === 'origen' ? 'referrerHostname' : pestana === 'publico' ? 'deviceType' : 'requestPath',
  )

  // El título de verdad en vez de la URL, sólo cuando hace falta: una consulta
  // a la base para las diez notas, y ninguna en las otras tres pestañas.
  const titulos =
    pestana === 'notas'
      ? await getTitulosPorSlugs(
          filasDeLaPestana
            .map((fila) => slugDeNota(fila.clave))
            .filter((slug): slug is string => slug !== null),
        )
      : new Map<string, string>()

  if (totales.vistas === 0) {
    return (
      <Pantalla rango={rango} pestana={pestana}>
        <Aviso>
          Todavía no hay visitas registradas en este rango. Si Web Analytics se
          acaba de prender, los primeros datos tardan unos minutos en aparecer y
          sólo se cuentan las visitas al sitio publicado, no las de desarrollo.
        </Aviso>
      </Pantalla>
    )
  }

  return (
    <Pantalla rango={rango} pestana={pestana}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Total
          numero={totales.vistas}
          etiqueta="Páginas vistas"
          nota="Sin contar el panel: lo que leyó gente, no vos trabajando."
        />
        <Total
          numero={totales.visitantes}
          etiqueta="Visitantes"
          nota="Sumados por día: quien volvió otro día cuenta dos veces."
        />
      </div>

      <div className="border border-border bg-bg-elevated p-5">
        <h2 className="titular mb-3 text-[1.05rem]">Visitas por día</h2>
        <GraficoVisitas serie={serie} />
      </div>

      <PestanasEstadisticas actual={pestana} rango={rango} />

      {pestana === 'notas' && (
        <TopDeVisitas
          titulo="Las notas más leídas"
          filas={filasDeLaPestana}
          etiqueta={(ruta) => {
            const slug = slugDeNota(ruta)
            return (slug && titulos.get(slug)) ?? nombreDeRuta(ruta)
          }}
          vacio="Todavía nadie abrió una nota en este rango."
        />
      )}

      {pestana === 'secciones' && (
        <TopDeVisitas
          titulo="Las secciones"
          filas={filasDeLaPestana}
          etiqueta={nombreDeRuta}
          vacio="Sin visitas a las secciones."
        />
      )}

      {pestana === 'origen' && (
        <TopDeVisitas
          titulo="De dónde llegan"
          filas={filasDeLaPestana}
          vacio="Nadie llegó desde otro sitio: todas las visitas fueron directas."
        />
      )}

      {pestana === 'publico' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <TopDeVisitas
            titulo="Con qué entran"
            filas={filasDeLaPestana}
            vacio="Sin datos de dispositivo."
          />
          <TopDeVisitas
            titulo="Desde dónde"
            filas={filasTop(segunda?.filas ?? [], 'country')}
            vacio="Sin datos de país."
          />
        </div>
      )}
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
function Pantalla({
  rango,
  pestana,
  children,
}: {
  rango: number
  pestana: PestanaEstadisticas
  children: React.ReactNode
}) {
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
              // Arrastra la pestaña, igual que la pestaña arrastra el rango:
              // cambiar a 30 días y volver a la primera lista obligaría a dos
              // clicks cada vez.
              href={`/admin/estadisticas?rango=${dias}${
                pestana === PESTANA_ESTADISTICAS_POR_OMISION ? '' : `&ver=${pestana}`
              }`}
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
