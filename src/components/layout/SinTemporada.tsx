import Link from 'next/link'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'

/**
 * Lo que se muestra cuando una ruta necesita la temporada en curso y no hay
 * ninguna cargada.
 *
 * Existe porque `/plantel` y `/fixture` están en la navegación de **todas** las
 * páginas y hasta ahora daban 404. Un 404 en un link del menú principal le dice
 * al lector que el sitio está roto; esto le dice que esa sección todavía no
 * tiene datos, que es lo cierto, y lo manda a algo que sí existe.
 */
interface Props {
  titulo: string
  explicacion: string
}

export function SinTemporada({ titulo, explicacion }: Props) {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <CabeceraBloque id="sin-temporada" titulo={titulo} nivel={1} />

      <div className="max-w-medida border-l-4 border-verde-600 bg-papel-alt py-6 pl-5">
        <p className="font-body text-[1.05rem] leading-relaxed text-tinta-suave">
          {explicacion}
        </p>

        <p className="mt-4 font-body text-gris">
          Mientras tanto están{' '}
          <Link href="/cronicas" className="text-verde-600 underline underline-offset-2">
            las crónicas
          </Link>{' '}
          y{' '}
          <Link href="/analisis" className="text-verde-600 underline underline-offset-2">
            los análisis
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
