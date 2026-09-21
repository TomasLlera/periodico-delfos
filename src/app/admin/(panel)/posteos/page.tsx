import type { Metadata } from 'next'
import Link from 'next/link'
import { Aviso } from '@/components/admin/Aviso'
import { BotonReintentar } from '@/components/admin/BotonReintentar'
import { getPosteos } from '@/lib/supabase/queries/social'
import { FilaPosteo } from './FilaPosteo'

/**
 * Qué pasó con los posteos a las redes.
 *
 * Es el `EstadoPosteos` del Step 18. Sin esta pantalla el pipeline escribe
 * `social_posts` y **nadie lo ve**: saber si una nota salió en Facebook era
 * abrir la base a mano.
 *
 * Se agrupa por nota y no por red. Una nota genera tres filas que se miran
 * juntas —"salió en dos de tres"— y el reintento es por nota, no por red: la
 * función durable decide sola cuáles tocan.
 */
export const metadata: Metadata = { title: 'Posteos' }
export const dynamic = 'force-dynamic'

export default async function Posteos() {
  const posteos = await getPosteos()

  // Por nota, en el orden en que vinieron: la query ya los trajo del más
  // reciente al más viejo.
  const porNota = new Map<string, typeof posteos>()
  for (const posteo of posteos) {
    const grupo = porNota.get(posteo.nota_id)
    if (grupo) grupo.push(posteo)
    else porNota.set(posteo.nota_id, [posteo])
  }

  const simulados = posteos.filter((p) => p.external_post_id?.startsWith('simulado-'))

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Posteos</h1>

      {simulados.length > 0 && (
        <div className="mb-5">
          <Aviso tono="atencion">
            Hay {simulados.length} posteo{simulados.length > 1 ? 's' : ''} simulado
            {simulados.length > 1 ? 's' : ''}: el pipeline corrió pero no se publicó nada. Pasa
            mientras falten las credenciales de Meta y de X, o con{' '}
            <code>SOCIAL_DRY_RUN=true</code> puesto.
          </Aviso>
        </div>
      )}

      {posteos.length === 0 ? (
        <Aviso>
          Todavía no se posteó nada. Cada nota que se publique con el auto-posteo prendido deja
          acá una fila por red.
        </Aviso>
      ) : (
        <ul className="flex flex-col gap-6">
          {[...porNota.entries()].map(([notaId, filas]) => (
            <li key={notaId}>
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <h2 className="meta text-gris">
                  {filas[0].nota?.titulo ?? filas[0].nota_slug}
                </h2>
                <span className="ml-auto">
                  <BotonReintentar
                    notaId={notaId}
                    titulo={filas[0].nota?.titulo ?? filas[0].nota_slug}
                  />
                </span>
              </div>

              <ul>
                {filas.map((posteo) => (
                  <FilaPosteo key={posteo.id} posteo={posteo} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 border-t border-linea pt-4 text-[0.85rem] text-gris">
        Reintentar vuelve a disparar el pipeline: destraba lo que quedó en curso y reintenta lo
        que falló. <strong>Lo que ya se publicó no se vuelve a publicar.</strong> Las redes de
        cada nota se eligen en{' '}
        <Link href="/admin" className="underline underline-offset-4">
          su editor
        </Link>
        .
      </p>
    </main>
  )
}
