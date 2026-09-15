import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

/**
 * Portada provisoria.
 *
 * La real se construye en el Step 9 del blueprint (nota principal + últimas 4 +
 * fecha a fecha + goleadoras + archivo), y necesita datos en Supabase. Hasta
 * entonces esto sirve para verificar tokens, fuentes y layout.
 */
export default function Home() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-12">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-7 w-2.5 shrink-0 rounded-sm bg-verde-600" />
          <p className="meta text-verde-600">Primera B 2026</p>
        </div>
        <h1 className="titular mt-3 max-w-[18ch] text-[32px] md:text-[48px]">
          El fútbol femenino de Aldosivi, fecha a fecha
        </h1>

        <div className="prose-nota mt-8">
          <p>
            Este es el texto de prueba de la medida de lectura. La regla no
            negociable del proyecto es que el cuerpo de las notas no supere los
            68 caracteres por línea: el sitio actual corre a unos 140 y es el
            problema número uno de legibilidad. Si esta línea se corta antes de
            llegar al borde de la pantalla en un monitor ancho, el token está
            bien aplicado.
          </p>
          <h2>Un subtítulo con su filete</h2>
          <p>
            Los <a href="/cronicas">links del cuerpo</a> van en verde y
            subrayados, porque el color solo no llega al contraste mínimo de
            WCAG AA. Los datos deportivos —{' '}
            <span className="dato">23&apos;</span>,{' '}
            <span className="dato">0 - 1</span> — usan la mono para que
            alineen en columna.
          </p>
        </div>
      </main>

      <Footer />
    </>
  )
}
