import Link from 'next/link'

/**
 * El pie de los dos bocetos de `referencia/`: fondo `negro-cancha`, filete
 * amarillo de 6px arriba, columnas y una línea legal en mono abajo.
 *
 * **Todos los destinos son reales.** El pie de WordPress arrastra links del
 * demo import del theme —Cookies apunta a `/blog/`, Términos a `/contact-2/` y
 * Contacto a `/contact-3/`— y los títulos están en inglés ("Useful Links",
 * "Read More"). Acá no: esto es lo que pide el Step 10 del Build Order.
 *
 * Como en la cabecera, el texto va en blanco con alfa y no en `text-tinta`:
 * `negro-cancha` es oscuro en los dos temas. El hover de los links es amarillo
 * (8.02:1) y no `verde-600`, que sobre este fondo da 1.98:1 y no se lee.
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
   * Acá faltan Contacto y Privacidad, y es a propósito.
   *
   * Las dos rutas no existen, así que los dos links daban **404 desde el pie de
   * todas las páginas del sitio**. Un 404 en el pie de cada pantalla es peor
   * que un pie con una sección más corta, y en una URL pública lo ve cualquiera.
   *
   * No se escriben las páginas porque dependen de cuatro datos que sólo tiene
   * Charlie: el mail del medio, los handles de las redes, el responsable de
   * datos y si el sitio va a usar analítica —de eso depende si la política
   * tiene que hablar de cookies—. **Una política de privacidad inventada es un
   * documento legal falso.**
   *
   * Cuando estén los datos, esto se revierte agregando las dos líneas de vuelta
   * y creando las rutas. Está contado en `docs/encargos/accesibilidad-y-pie.md`.
   */
  {
    titulo: 'El medio',
    links: [{ href: '/quienes-somos', label: 'Quiénes somos' }],
  },
] as const

export function Footer() {
  const anio = new Date().getFullYear()

  return (
    <footer className="franja mt-bloque border-t-[6px] border-amarillo text-white/70">
      <div className="contenedor">
        {/* Dos columnas ya en celular, con la marca cruzada arriba. Apiladas de
            a una, "El equipo" y "El medio" son dos listas cortas separadas por
            un tirón de scroll cada una; al lado se leen de un vistazo y el pie
            mide la mitad. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-[2fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <p className="marca text-[1.6rem] text-white">
              Periódico <span className="text-amarillo">Delfos</span>
            </p>
            <p className="mt-3 max-w-[34ch] text-[0.9rem]">
              El fútbol femenino de Aldosivi, fecha a fecha. Crónicas, análisis
              y estadísticas de las Tiburonas, desde Mar del Plata.
            </p>
          </div>

          {SECCIONES.map((seccion) => (
            <nav key={seccion.titulo} aria-label={seccion.titulo}>
              <h2 className="meta text-amarillo">{seccion.titulo}</h2>
              <ul className="mt-1 lg:mt-3 lg:space-y-[0.45rem]">
                {seccion.links.map((link) => (
                  <li key={link.href}>
                    {/* `min-h-11` en celular: estos links medían 16px de alto,
                        muy por debajo de los 44 que pide el sistema de diseño.
                        En escritorio, donde se apunta con el mouse, vuelven a
                        su interlineado apretado. */}
                    <Link
                      href={link.href}
                      className="flex min-h-11 items-center font-display text-[0.9rem] underline-offset-4 hover:text-amarillo hover:underline lg:min-h-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="dato flex flex-col gap-2 border-t border-white/15 py-4 text-[0.72rem] sm:flex-row sm:justify-between">
          <span>© {anio} Periódico Delfos · Mar del Plata, Argentina</span>
          <span>Hecho para el fútbol femenino argentino</span>
        </div>
      </div>
    </footer>
  )
}
