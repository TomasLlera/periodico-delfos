import { RedesDelMedio } from '@/components/layout/RedesDelMedio'
import { redesDelMedio } from '@/lib/redes-del-medio'
import Link from 'next/link'

/**
 * El pie de los dos bocetos de `referencia/`: fondo `block-bg`, filete
 * dorado de 6px arriba, columnas y una línea legal en mono abajo.
 *
 * **Todos los destinos son reales.** El pie de WordPress arrastra links del
 * demo import del theme —Cookies apunta a `/blog/`, Términos a `/contact-2/` y
 * Contacto a `/contact-3/`— y los títulos están en inglés ("Useful Links",
 * "Read More"). Acá no: esto es lo que pide el Step 10 del Build Order.
 *
 * Como en la cabecera, el texto va en `block-text` con alfa y no en
 * `text-text`: el bloque es oscuro en los dos temas. El hover de los links es
 * `block-accent` (7.25:1), no `accent-text`, que sobre este fondo no se lee.
 *
 * **Falta la cuarta columna del boceto, "Seguinos"** (Instagram, X, YouTube).
 * No hay un solo handle del medio en el proyecto ni en los datos de WordPress
 * —los únicos links a redes en las notas son embeds de cuentas ajenas— y
 * escribir `instagram.com/periodicodelfos` a ojo es inventar un dato. Las
 * cuentas hacen falta igual para el auto-posteo: cuando estén, entra la
 * columna.
 */
const SECCIONES = [
  {
    titulo: 'El equipo',
    links: [
      { href: '/plantel', label: 'Plantel' },
      { href: '/cronicas', label: 'Crónicas' },
      { href: '/analisis', label: 'Análisis' },
      { href: '/fixture', label: 'Fixture y tabla' },
    ],
  },
  /**
   * Contacto volvió el 02/10/2026, cuando Charlie pasó el mail del medio.
   *
   * Estuvo afuera desde el principio y era a propósito: la ruta no existía
   * —faltaba saber a qué dirección quiere que le escriban— y el link daba **404
   * desde el pie de todas las páginas del sitio**, que es peor que un pie con
   * una sección más corta.
   *
   * **Privacidad sigue faltando**, por la misma regla. Ya están el responsable
   * de datos y el mail, pero la política tiene que decir la verdad sobre
   * cookies, y eso depende de si se prenden la analítica y la publicidad, que
   * todavía no se prendieron. Entra cuando esté escrita y no antes: **una
   * política de privacidad inventada es un documento legal falso.** Está
   * contado en `docs/encargos/accesibilidad-y-pie.md`.
   */
  {
    titulo: 'El medio',
    links: [
      { href: '/quienes-somos', label: 'Quiénes somos' },
      { href: '/contacto', label: 'Contacto' },
    ],
  },
] as const

export function Footer() {
  const hayRedes = redesDelMedio().length > 0

  const anio = new Date().getFullYear()

  return (
    <footer className="franja mt-bloque border-t-[6px] border-accent text-block-text/70">
      <div className="contenedor">
        {/* Dos columnas ya en celular, con la marca cruzada arriba. Apiladas de
            a una, "El equipo" y "El medio" son dos listas cortas separadas por
            un tirón de scroll cada una; al lado se leen de un vistazo y el pie
            mide la mitad. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-[2fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <p className="marca text-[1.6rem] text-block-text">
              Periódico <span className="text-block-accent">Delfos</span>
            </p>
            <p className="mt-3 max-w-[34ch] text-[0.9rem]">
              El fútbol femenino de Aldosivi, fecha a fecha. Crónicas, análisis
              y estadísticas de las Tiburonas, desde Mar del Plata.
            </p>
          </div>

          {SECCIONES.map((seccion) => (
            <nav key={seccion.titulo} aria-label={seccion.titulo}>
              <h2 className="meta text-block-accent">{seccion.titulo}</h2>
              <ul className="mt-1 lg:mt-3 lg:space-y-[0.45rem]">
                {seccion.links.map((link) => (
                  <li key={link.href}>
                    {/* `min-h-11` en celular: estos links medían 16px de alto,
                        muy por debajo de los 44 que pide el sistema de diseño.
                        En escritorio, donde se apunta con el mouse, vuelven a
                        su interlineado apretado. */}
                    <Link
                      href={link.href}
                      className="flex min-h-11 items-center font-display text-[0.9rem] underline-offset-4 hover:text-block-accent hover:underline lg:min-h-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* La cuarta columna del boceto, que faltaba desde el principio por
              no tener adónde mandar. Ahora los handles salen del entorno, así
              que la columna aparece sola el día que se carguen y sigue sin
              dibujarse mientras no estén —`<RedesDelMedio />` devuelve `null`
              con la lista vacía, y entonces este `<nav>` tampoco tiene sentido,
              por eso se pregunta antes de abrirlo—. */}
          {hayRedes && (
            <nav aria-label="Seguinos">
              <h2 className="meta text-block-accent">Seguinos</h2>
              <RedesDelMedio variante="pie" className="mt-1 lg:mt-3" />
            </nav>
          )}
        </div>

        <div className="dato flex flex-col gap-2 border-t border-block-text/15 py-4 text-[0.72rem] sm:flex-row sm:justify-between">
          <span>© {anio} Periódico Delfos · Mar del Plata, Argentina</span>
          <span>Hecho para el fútbol femenino argentino</span>
        </div>
      </div>
    </footer>
  )
}
