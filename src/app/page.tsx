import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { BloqueArchivo } from '@/components/portada/BloqueArchivo'
import { Goleadoras } from '@/components/portada/Goleadoras'
import { GrillaNotas } from '@/components/portada/GrillaNotas'
import { ListaAnalisis } from '@/components/portada/ListaAnalisis'
import { NotaTapa } from '@/components/portada/NotaTapa'
import { TarjetaPlantel } from '@/components/portada/TarjetaPlantel'
import { UltimoResultado } from '@/components/portada/UltimoResultado'
import { getTemperatura } from '@/lib/clima'
import { getEstadoDelSitio } from '@/lib/supabase/queries/estado'
import { getNotaPrincipal, getUltimasNotas } from '@/lib/supabase/queries/notas'
import { getEventosDePartido } from '@/lib/supabase/queries/partidos'
import { haySupabase } from '@/lib/supabase/server'
import type { NotaResumen } from '@/types'
import { urlDelSitio } from '@/lib/sitio'

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
 * **Los widgets deportivos se dibujan sólo si la base tiene con qué.**
 * `<BarraEstado />` va en el layout raíz —aparece en todas las páginas, no sólo
 * acá—; `<UltimoResultado />` y `<Goleadoras />` salen de
 * `getEstadoDelSitio()`, que sin temporada activa devuelve todo vacío y los
 * borra solos. En la ruta pública no aparece nunca un marcador inventado (regla
 * no negociable 1); para verlos dibujados está `/demo/widgets`, que es su único
 * banco de pruebas: `/demo/portada` no los muestra a propósito, para que la
 * demo de la portada siga siendo la de las notas.
 *
 * **`<FechaAFecha />` salió de acá.** Estaba entre las crónicas y el análisis
 * con un comentario que decía "como en el boceto", y en el boceto no está: la
 * única aparición de "fecha a fecha" en `referencia/boceto-portada.html` es una
 * frase del pie. Era además la tercera puerta a lo mismo —la barra de estado
 * arriba, "Fixture y tabla" en la nav— y ocupaba menos de la mitad del ancho
 * del bloque. En su lugar va la `.planilla` del boceto, que sí estaba y
 * faltaba. La franja sigue viva en `/temporada/[slug]`.
 *
 * El bloque de plantel sigue dibujándose sin sus caras ni sus estadísticas:
 * salen de `plantel` y `estadisticas_jugadora`, que la portada todavía no
 * consulta. Y el newsletter no está en el Build Order: no se decidió si es un
 * step o una maqueta.
 *
 * ISR 60s (blueprint 7.1). Al publicar, el Server Action además revalida `/`.
 */
export const revalidate = 60

const SITE_URL = urlDelSitio()

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
  // Las tres lecturas son independientes: el clima no espera a la base, y lo
  // deportivo no espera a las notas. `getEstadoDelSitio()` está memoizada, así
  // que ésta es la misma lectura que ya hizo el layout para la barra.
  const [{ tapa, cronicas, analisis }, temperatura, deportivo] = await Promise.all([
    leerContenido(),
    getTemperatura(),
    getEstadoDelSitio(),
  ])

  // Los goles van aparte y después, porque dependen de qué partido salió: el
  // id lo da `getEstadoDelSitio()`, que es la misma lectura que alimenta la
  // barra de estado. Sin último partido no se pide nada.
  const golesDelUltimo = deportivo.ultimo
    ? await getEventosDePartido(deportivo.ultimo.id)
    : []

  // Con la portada entera vacía —hoy, sin notas migradas— las secciones se
  // dibujan con su estado escrito. Omitirlas deja cuatro bloques sueltos que no
  // se parecen ni a un diario ni al boceto. Apenas haya una nota publicada, las
  // que sigan vacías desaparecen solas.
  const portadaVacia = !tapa && cronicas.length === 0 && analisis.length === 0

  return (
    <>
      <Header temperatura={temperatura} />

      <main className="contenedor pb-4">
        {/* El `<h1>` de la portada, que no se ve y tiene que estar.

            La portada no tiene un titular propio: lo más grande de la página
            es la nota de tapa, y ponerle el `<h1>` a esa nota diría que la
            página se llama como la nota del día. El nombre del medio está en
            la cabecera, pero ahí es un link que se repite en todas las
            páginas y no puede ser el `<h1>` de ninguna.

            Sin esto la portada quedaba sin ningún `<h1>`: quien navega con
            lector de pantalla saltaba de encabezado en encabezado sin saber
            nunca en qué página estaba. */}
        <h1 className="sr-only">
          Periódico Delfos, fútbol femenino de Aldosivi desde Mar del Plata
        </h1>

        {tapa ? (
          <NotaTapa nota={tapa} />
        ) : (
          <p className="mt-8 border-l-4 border-verde-600 bg-papel-alt py-6 pl-5 font-body text-gris">
            Todavía no hay ninguna nota publicada. La primera que se publique
            abre la portada.
          </p>
        )}

        {/* Pegado abajo de la tapa, como en el boceto: lo último que pasó en la
            cancha, con los goles y su minuto. Sin partido jugado no se dibuja. */}
        {deportivo.ultimo && (
          <UltimoResultado
            id="ultimo-resultado"
            partido={deportivo.ultimo}
            eventos={golesDelUltimo}
          />
        )}

        <GrillaNotas
          id="cronicas"
          titulo="Crónicas"
          notas={cronicas}
          enlace={{ href: '/cronicas', texto: 'Todas las crónicas' }}
          vacio={
            portadaVacia
              ? 'Todavía no hay crónicas publicadas. Las de cada fecha aparecen acá apenas salen.'
              : undefined
          }
        />


        <div className="mt-bloque grid gap-bloque lg:grid-cols-[2fr_1fr]">
          <ListaAnalisis
            id="analisis"
            titulo="Análisis"
            notas={analisis}
            enlace={{ href: '/analisis', texto: 'Ver más' }}
            vacio={portadaVacia ? 'Todavía no hay análisis publicados.' : undefined}
          />

          <div>
            <TarjetaPlantel
              titulo="El plantel"
              descripcion="Fichas, estadísticas y trayectoria de cada una de las jugadoras de Aldosivi."
              enlace={{ href: '/plantel', texto: 'Ver el plantel completo' }}
            />

            {deportivo.temporada && (
              <Goleadoras
                id="goleadoras"
                goleadoras={deportivo.goleadoras}
                temporada={deportivo.temporada}
              />
            )}
          </div>
        </div>

        <BloqueArchivo />
      </main>

      <Footer />
    </>
  )
}
