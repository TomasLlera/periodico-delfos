import type { Metadata } from 'next'
import { FormularioNota } from '@/components/admin/FormularioNota'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { getPartidosParaEditor } from '@/lib/supabase/queries/partidos'
import { getTemporadas } from '@/lib/supabase/queries/temporadas'

/**
 * Nota nueva.
 *
 * No crea nada al abrirse: la fila aparece recién con el primer guardado. Abrir
 * el editor y cerrarlo no tiene que dejar un borrador vacío en el listado.
 */
export const metadata: Metadata = { title: 'Nota nueva' }
export const dynamic = 'force-dynamic'

export default async function NotaNueva() {
  const [temporadas, autor, partidos] = await Promise.all([getTemporadas(), getAutorDeLaSesion(), getPartidosParaEditor()])

  // El layout del panel ya redirigió si no hay autor; esto es para el tipo.
  if (!autor) return null

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Nota nueva</h1>
      <FormularioNota nota={null} temporadas={temporadas} partidos={partidos} autor={autor} />
    </main>
  )
}
