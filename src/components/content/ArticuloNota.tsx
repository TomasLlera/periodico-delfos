/**
 * El artículo completo, según el blueprint 7.3.
 *
 * Componente **puro**: recibe la nota ya leída, los partidos ya resueltos y las
 * relacionadas ya filtradas, y no consulta nada. Es la misma regla que sigue
 * `<PlanillaPartido />`, y lo que permite mirarlo con datos falsos en
 * `/demo/articulo` mientras no exista el proyecto de Supabase.
 *
 * El orden de la página no es arbitrario:
 *
 *   Metadatos → h1 → Bajada → LíneaAutor → Portada → Compartir → Cuerpo
 *   → Planilla del partido → Compartir → CajaAutor → Relacionadas
 *
 * - **Los metadatos van arriba del `<h1>` pero fuera de él.** El sufijo
 *   "Fecha 11 – Aldosivi Femenino en la Primera B 2026" que WordPress metía
 *   adentro del título es lo que truncaba todos los titulares del sitio.
 * - **Compartir aparece dos veces, y no es un descuido.** Arriba porque el
 *   blueprint lo ubica ahí (7.3) y porque quien ya conoce la nota la reenvía
 *   sin scrollear 900 palabras; abajo porque el momento natural de compartir
 *   es cuando terminaste de leer. Son dos instancias independientes: el
 *   "¡Copiado!" de una no toca a la otra, que es lo correcto.
 */

import { Bajada } from '@/components/content/Bajada'
import { BotonesCompartir } from '@/components/content/BotonesCompartir'
import { CajaAutor } from '@/components/content/CajaAutor'
import { CuerpoNota } from '@/components/content/CuerpoNota'
import { ImagenResponsive } from '@/components/content/ImagenResponsive'
import { LineaAutor } from '@/components/content/LineaAutor'
import { NotasRelacionadas } from '@/components/content/NotasRelacionadas'
import { PlanillaPartido } from '@/components/partido/PlanillaPartido'
import { contarPalabras, etiquetaFecha, tiempoLectura } from '@/lib/formato'
import { partidoIdsDelCuerpo } from '@/lib/tiptap/esquema'
import type { MapaDePartidos } from '@/lib/tiptap/render'
import type { NotaConRelaciones, NotaResumen, PartidoCompleto } from '@/types'

const ETIQUETA_CATEGORIA = {
  cronica: 'Crónica',
  analisis: 'Análisis',
  temporada: 'Temporada',
  plantel: 'Plantel',
  institucional: 'Institucional',
} as const

interface Props {
  nota: NotaConRelaciones
  /** URL absoluta y canónica, para los botones de compartir. */
  url: string
  /** Partidos embebidos en el cuerpo, ya resueltos por la página. */
  partidos: MapaDePartidos
  /**
   * El partido de la nota, completo. Va abajo del cuerpo.
   *
   * Es aparte de `nota.partido` —que sólo trae equipos y temporada— porque la
   * planilla necesita eventos y formaciones.
   */
  partidoDeLaNota: PartidoCompleto | null
  relacionadas: readonly NotaResumen[]
}

export function ArticuloNota({
  nota,
  url,
  partidos,
  partidoDeLaNota,
  relacionadas,
}: Props) {
  const palabras = contarPalabras(nota.cuerpo)

  // La planilla va **una sola vez**. Si el cuerpo ya la embebe —el autor eligió
  // dónde—, esa manda y la del pie no se dibuja. La del pie existe para la
  // crónica que no puso el nodo: sin ella esa nota se quedaría sin los datos
  // del partido, que son el corazón del proyecto.
  const yaEstaEnElCuerpo =
    nota.partido_id !== null && partidoIdsDelCuerpo(nota.cuerpo).includes(nota.partido_id)

  const planillaAlPie = yaEstaEnElCuerpo ? null : partidoDeLaNota

  return (
    <article className="mx-auto max-w-[1200px] px-4 py-8 md:py-12">
      <p className="meta">
        {ETIQUETA_CATEGORIA[nota.categoria]}
        {nota.partido && ` · ${etiquetaFecha(nota.partido)}`}
        {!nota.partido && nota.temporada && ` · ${nota.temporada.nombre}`}
      </p>

      <h1 className="titular mt-2 max-w-[20ch] text-[32px] md:text-[48px]">
        {nota.titulo}
      </h1>

      <Bajada>{nota.bajada}</Bajada>

      <LineaAutor
        autor={nota.autor}
        publicadaEn={nota.publicada_en}
        tiempoDeLectura={tiempoLectura(palabras)}
      />

      {nota.imagen_portada && (
        <div className="mt-6">
          <ImagenResponsive
            src={nota.imagen_portada}
            alt={nota.imagen_alt}
            credito={nota.imagen_credito}
            // Es el LCP de la página: no se difiere.
            prioridad
            sizes="(min-width: 1024px) 1000px, 100vw"
            className="w-full rounded-sm"
          />
        </div>
      )}

      <div className="mt-6">
        <BotonesCompartir url={url} titulo={nota.titulo} />
      </div>

      <div className="mt-8">
        <CuerpoNota cuerpo={nota.cuerpo} partidos={partidos} />
      </div>

      {planillaAlPie && (
        <div className="mt-10 max-w-[68ch]">
          {/* Plegable: dentro de una nota la planilla es un aparte, y quien ya
              leyó la crónica tiene que poder sacarla del camino. */}
          <PlanillaPartido
            partido={planillaAlPie}
            variante="completa"
            nivelTitulo={2}
            plegable
          />
        </div>
      )}

      <div className="mt-10 max-w-[68ch] border-t border-linea pt-5">
        <BotonesCompartir url={url} titulo={nota.titulo} etiqueta="Compartí esta nota" />
      </div>

      <div className="max-w-[68ch]">
        <CajaAutor autor={nota.autor} />
      </div>

      <NotasRelacionadas notas={relacionadas} />
    </article>
  )
}
