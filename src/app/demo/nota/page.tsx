import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { partidoCompleto } from '@/app/demo/planilla/datos-demo'
import { cuerpoCompleto, cuerpoHostil } from '@/app/demo/nota/documento-demo'
import { CuerpoTipTap, mapaDePartidos } from '@/lib/tiptap/render'

/**
 * Banco de pruebas del renderer de TipTap.
 *
 * Existe para poder mirar el cuerpo de una nota antes de que haya un proyecto
 * de Supabase. Se borra —junto con `documento-demo.ts`— cuando la migración
 * cargue notas reales.
 */
export const metadata: Metadata = {
  title: 'Cuerpo de nota · banco de pruebas',
  robots: { index: false, follow: false },
}

/**
 * En la nota real esto lo arma la página: lee `notas.cuerpo`, junta los
 * `partidoId` de los nodos `planilla` y hace una sola consulta por todos.
 */
const PARTIDOS = mapaDePartidos([partidoCompleto])

export default function DemoNota() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas · datos falsos</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          &lt;CuerpoTipTap /&gt;
        </h1>
        <p className="prose-nota mt-4 text-gris">
          Esta página no se indexa y no llega a producción. Está para mirar cómo
          cae cada nodo del cuerpo dentro de la medida de 68ch, y para comprobar
          que un documento mal cargado se degrada en vez de romper la nota. Las
          imágenes apuntan a un bucket que todavía no existe: van a salir rotas,
          con su `alt` a la vista, que es exactamente lo que tiene que pasar.
        </p>

        <Seccion
          titulo="1 · Todos los nodos"
          nota="Párrafos, h2 y h3, negrita, itálica, código, links internos y externos, viñetas, lista ordenada, cita, separador, salto de línea, imagen con epígrafe y la planilla embebida. El párrafo vacío del final de TipTap no dibuja nada."
        >
          <CuerpoTipTap cuerpo={cuerpoCompleto} partidos={PARTIDOS} nivelBase={3} />
        </Seccion>

        <Seccion
          titulo="2 · Un cuerpo mal cargado"
          nota="Ocho nodos rotos entre dos párrafos sanos: links con esquema prohibido, imagen sin alt, imagen con src data:, planilla sin id, planilla de un partido que no se precargó, un nodo de una extensión inexistente y una lista vacía. Se tienen que ver los dos párrafos y nada más."
        >
          <CuerpoTipTap cuerpo={cuerpoHostil} partidos={PARTIDOS} nivelBase={3} />
        </Seccion>

        <Seccion
          titulo="3 · Un cuerpo que no es un documento"
          nota="Lo que quedaría si una fila trajera el HTML crudo de WordPress. La validación no lo deja pasar y el renderer no devuelve nada: hueco, no pantalla de error. La página que lo use decide qué escribir en su lugar."
        >
          <div className="border border-dashed border-linea p-4">
            <CuerpoTipTap cuerpo={'<p>Un párrafo de WordPress</p>'} partidos={PARTIDOS} />
            <p className="meta">↑ El recuadro está vacío a propósito.</p>
          </div>
        </Seccion>
      </main>

      <Footer />
    </>
  )
}

function Seccion({
  titulo,
  nota,
  children,
}: {
  titulo: string
  nota: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-14">
      <h2 className="border-t-[3px] border-verde-600 pt-2 font-display text-[22px] font-semibold">
        {titulo}
      </h2>
      <p className="mt-1 max-w-[68ch] font-display text-[13px] leading-relaxed text-gris">
        {nota}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  )
}
