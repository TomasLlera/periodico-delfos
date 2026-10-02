import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FormularioNota } from '@/components/admin/FormularioNota'
import { firmaDe } from '@/lib/nota'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { getNotaPorId, getNotasParaEnlazar } from '@/lib/supabase/queries/notas'
import { getPartidosParaEditor } from '@/lib/supabase/queries/partidos'
import { getTemporadas } from '@/lib/supabase/queries/temporadas'

/**
 * Editar una nota que ya existe, publicada o no.
 *
 * La identidad acá es el id y no el slug: el slug es la URL pública y no se
 * recalcula al renombrar (regla no negociable 8), así que no sirve como
 * identificador estable dentro del panel.
 *
 * `notFound()` cubre dos casos que desde afuera son el mismo: que la nota no
 * exista, y que exista pero RLS no la deje ver. Distinguirlos le confirmaría a
 * un extraño qué ids hay en la base.
 */
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const nota = await getNotaPorId((await params).id)
  return { title: nota ? nota.titulo : 'Nota' }
}

export default async function EditarNota({ params }: Params) {
  const { id } = await params
  const [nota, temporadas, partidos, enlazables, yo] = await Promise.all([
    getNotaPorId(id),
    getTemporadas(),
    getPartidosParaEditor(),
    getNotasParaEnlazar(),
    getAutorDeLaSesion(),
  ])

  if (!nota) notFound()

  // La nota de otro, abierta por un redactor. RLS la deja **leer** si está
  // publicada —publicado es público— pero no la deja guardar, así que sin esto
  // el editor se abre entero y el error aparece recién al apretar Guardar.
  // `notFound()` por lo mismo que arriba: es el estado que no confirma nada.
  if (yo && yo.rol !== 'editor' && nota.autor_id !== firmaDe(yo)) notFound()

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Editar nota</h1>
      {/*
        El autor de la nota, no el de la sesión: editar no reasigna la firma
        (ver `src/actions/notas.ts`), así que la vista previa tiene que seguir
        mostrando a quien la escribió aunque la esté corrigiendo otro.
      */}
      <FormularioNota nota={nota} temporadas={temporadas} partidos={partidos} enlazables={enlazables} autor={nota.autor} />
    </main>
  )
}
