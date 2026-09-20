import type { Metadata } from 'next'
import { FormularioJugadora } from '@/components/admin/FormularioJugadora'

export const metadata: Metadata = { title: 'Jugadora nueva' }

export default function JugadoraNueva() {
  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Jugadora nueva</h1>

      {/* La ficha se crea vacía y no necesita nada de la base: el dorsal, que
          es lo único que dependería de otra tabla, se pone en el plantel. */}
      <FormularioJugadora jugadora={null} />
    </main>
  )
}
