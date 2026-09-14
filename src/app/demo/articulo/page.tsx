import type { Metadata } from 'next'
import { ArticuloNota } from '@/components/content/ArticuloNota'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { mapaDePartidos } from '@/lib/tiptap/render'
import { cuerpoCompleto } from '@/app/demo/nota/documento-demo'
import { partidoCompleto } from '@/app/demo/planilla/datos-demo'
import type { Autor, NotaConRelaciones, NotaResumen } from '@/types'

/**
 * Banco de pruebas de `<ArticuloNota />`, la página de nota del Step 8.
 *
 * Existe para poder mirar el artículo entero antes de que haya un proyecto de
 * Supabase. La página real es `/nota/[slug]`, que lee la base y le pasa lo
 * mismo a este componente. Se borra —con `documento-demo.ts` y `datos-demo.ts`—
 * cuando la migración cargue notas reales.
 *
 * Las imágenes apuntan a un bucket que todavía no existe: van a salir rotas,
 * con su `alt` a la vista, que es lo que tiene que pasar.
 */
export const metadata: Metadata = {
  title: 'Artículo · banco de pruebas',
  robots: { index: false, follow: false },
}

const AUTOR: Autor = {
  id: 'aut-charlie',
  nombre: 'Charlie Redondo',
  slug: 'charlie-redondo',
  bio: 'Cubre el fútbol femenino de Aldosivi desde 2022. Escribe, saca las fotos y carga las planillas.',
  foto_url: null,
  instagram: 'periodicodelfos',
  x_handle: 'periodicodelfos',
}

const NOTA: NotaConRelaciones = {
  id: 'nota-demo',
  titulo: 'Las Tiburonas se quedaron con el clásico y quedaron a un punto',
  slug: 'aldosivi-all-boys-fecha-11',
  bajada:
    'Dos goles en doce minutos del segundo tiempo dieron vuelta un partido que se había puesto cuesta arriba. Cortadi volvió a ser la diferencia.',
  cuerpo: cuerpoCompleto,
  imagen_portada:
    'https://proyecto.supabase.co/storage/v1/object/public/media/2026/08/festejo.jpg',
  imagen_alt: 'Las jugadoras de Aldosivi se abrazan sobre el córner después del segundo gol',
  imagen_credito: 'Foto: Charlie Redondo',
  categoria: 'cronica',
  temporada_id: partidoCompleto.temporada_id,
  partido_id: partidoCompleto.id,
  autor_id: AUTOR.id,
  estado: 'publicada',
  publicada_en: '2026-08-08T21:40:00.000Z',
  destacada: true,
  auto_post: true,
  redes: ['facebook', 'instagram', 'x'],
  created_at: '2026-08-08T20:00:00.000Z',
  updated_at: '2026-08-08T21:40:00.000Z',
  autor: AUTOR,
  temporada: partidoCompleto.temporada,
  partido: partidoCompleto,
}

function relacionada(
  id: string,
  titulo: string,
  bajada: string,
  categoria: NotaResumen['categoria'],
  publicadaEn: string,
): NotaResumen {
  return {
    ...NOTA,
    id,
    titulo,
    bajada,
    categoria,
    slug: id,
    publicada_en: publicadaEn,
    imagen_portada: null,
    autor: { nombre: AUTOR.nombre, slug: AUTOR.slug },
  }
}

const RELACIONADAS: NotaResumen[] = [
  relacionada(
    'estudiantes-aldosivi-fecha-10',
    'Un empate que sabe a poco en La Plata',
    'Aldosivi lo ganaba hasta los 41 del segundo tiempo y lo dejó escapar en la última pelota.',
    'cronica',
    '2026-08-01T21:00:00.000Z',
  ),
  relacionada(
    'el-mediocampo-que-cambio-la-temporada',
    'El mediocampo que le cambió la temporada a Aldosivi',
    'Tres partidos sin recibir goles y una posesión que dejó de ser estéril: qué se modificó en la mitad de la cancha.',
    'analisis',
    '2026-07-25T14:00:00.000Z',
  ),
  relacionada(
    'plantel-primera-b-2026',
    'El plantel completo de la Primera B 2026',
    'Las 24 jugadoras, con dorsal y posición, más el cuerpo técnico.',
    'plantel',
    '2026-03-01T12:00:00.000Z',
  ),
]

export default function DemoArticulo() {
  return (
    <>
      <Header />

      <main>
        <div className="mx-auto max-w-[1200px] px-4 pt-8">
          <p className="meta">Banco de pruebas · datos falsos · no se indexa</p>
        </div>

        <ArticuloNota
          nota={NOTA}
          url="https://periodicodelfos.com/nota/aldosivi-all-boys-fecha-11"
          partidos={mapaDePartidos([partidoCompleto])}
          partidoDeLaNota={partidoCompleto}
          relacionadas={RELACIONADAS}
        />
      </main>

      <Footer />
    </>
  )
}
