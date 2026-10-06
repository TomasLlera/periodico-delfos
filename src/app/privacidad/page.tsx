import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { openGraphBase } from '@/lib/seo'
import { MAIL_DEL_MEDIO, urlDelSitio } from '@/lib/sitio'

/**
 * La política de privacidad.
 *
 * **Describe lo que el sitio hace hoy, no lo que podría hacer.** Es la razón de
 * que no existiera hasta ahora: faltaban el responsable de los datos y saber si
 * iba a haber analítica, y una política de privacidad inventada es un documento
 * legal falso. Charlie pasó los datos el 02/10/2026.
 *
 * Lo que dice cada punto está verificado contra el código, no asumido:
 *
 * - **Cookies: ninguna en el sitio público.** El middleware que refresca la
 *   sesión de Supabase corre con `matcher: ['/admin/:path*']`, así que un lector
 *   no recibe ni una cookie. Si ese matcher cambia, esta página miente.
 * - **La preferencia de tema** la guarda `next-themes` en `localStorage` con la
 *   clave `tema`. No es una cookie y no viaja en ningún pedido.
 * - **Analítica: Vercel Web Analytics, sin cookies.** Google Analytics sigue
 *   apagado —`<Analitica />` no inyecta nada sin `NEXT_PUBLIC_GA_ID`, y la
 *   variable no está cargada— y se descartó por lo contrario: deja cookies.
 * - **Publicidad: no hay.** Ni AdSense ni sponsors.
 * - **YouTube** sólo aparece si una nota tiene un video, y va al dominio
 *   `youtube-nocookie.com`, diferido.
 *
 * **El medidor de Vercel entró el 06/10/2026, y esta página lo declaró en el
 * mismo commit.** Ése es el orden que importa y el que hay que repetir: una
 * política que declara lo que todavía no existe es tan falsa como una que
 * esconde lo que ya está andando. Si mañana entra AdSense —que sí deja cookies
 * de terceros— se actualiza acá antes de prenderlo.
 *
 * No es asesoramiento legal: es la descripción honesta de lo que el sitio hace,
 * para que el responsable la revise y la firme.
 */
const SITE_URL = urlDelSitio()

const DESCRIPCION =
  'Qué datos recoge Periódico Delfos y qué no: hoy, el sitio público no usa cookies ni mide a sus lectores.'

/** La fecha de esta versión del documento. Se cambia cuando cambia el texto. */
const ACTUALIZADA = '2 de octubre de 2026'

const RESPONSABLE = 'Carlos Rogelio Redondo'

/**
 * El CUIT del responsable, que lo pasó él el 06/10/2026.
 *
 * **Su domicilio particular no se publica, y es una decisión.** Lo mandó junto
 * con el nombre y el CUIT, pero una política de privacidad queda indexada para
 * siempre y la leen los robots que juntan datos: un domicilio personal
 * publicado no se puede despublicar, porque para cuando alguien se arrepiente
 * ya está copiado en otro lado. Nombre, CUIT y un mail de contacto identifican
 * al responsable igual de bien. Si él quiere que figure, que sea una decisión
 * suya y no un efecto de habernos mandado los tres datos juntos.
 */
const CUIT = '20-38006487-2'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: DESCRIPCION,
  alternates: { canonical: `${SITE_URL}/privacidad` },
  openGraph: {
    ...openGraphBase({ titulo: 'Política de privacidad', descripcion: DESCRIPCION }, SITE_URL),
    type: 'website',
  },
}

export default function Privacidad() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <CabeceraBloque id="privacidad" titulo="Política de privacidad" nivel={1} />

        <div className="prose-nota">
          <p className="meta">Última actualización: {ACTUALIZADA}</p>

          <p>
            Esta página explica qué datos recoge <strong>Periódico Delfos</strong>{' '}
            cuando alguien lo lee, y qué no. Está escrita para que se entienda de
            una lectura.
          </p>

          <h2>Quién es responsable</h2>

          <p>
            El responsable del sitio y de los datos es <strong>{RESPONSABLE}</strong>,
            CUIT <span className="dato">{CUIT}</span>, editor de Periódico
            Delfos, en Mar del Plata, provincia de Buenos Aires. Para cualquier
            cosa relacionada con esta política:{' '}
            <a href={`mailto:${MAIL_DEL_MEDIO}`}>{MAIL_DEL_MEDIO}</a>.
          </p>

          <h2>Qué datos recogemos de quien lee</h2>

          <p>
            <strong>Ninguno que lo identifique.</strong> El sitio no pide
            registrarse, no tiene formularios, no tiene comentarios y no tiene
            lista de correo. No hace falta dar un dato para leer nada.
          </p>

          <h2>Cookies</h2>

          <p>
            <strong>El sitio público no usa cookies.</strong> Ni propias ni de
            terceros. La medición de visitas que sí hacemos funciona sin ellas:
            está explicada más abajo.
          </p>

          <p>
            Lo único que queda guardado en el navegador es la preferencia de tema
            —claro u oscuro— si alguien toca ese botón. Se guarda en el
            almacenamiento local del propio navegador, no viaja a ningún lado y
            se borra limpiando los datos del sitio.
          </p>

          <p>
            Quienes escriben en el medio entran a un panel de administración con
            usuario y contraseña, y ahí sí hay cookies de sesión. Son necesarias
            para mantener la sesión abierta y no alcanzan a quien sólo lee.
          </p>

          <h2>Qué ven los servicios que hacen funcionar el sitio</h2>

          <p>
            Como en cualquier página de internet, los servidores que entregan
            este sitio registran los pedidos que reciben, con la dirección IP y
            el navegador, para que funcione y para detectar abusos. Son dos
            proveedores: <strong>Vercel</strong>, que lo publica, y{' '}
            <strong>Supabase</strong>, donde viven las notas, las fotos y los
            datos de los partidos. Nosotros no usamos esos registros para
            perfilar a nadie.
          </p>

          <p>
            Si una nota tiene un video de YouTube embebido, al abrir la nota el
            navegador se conecta a YouTube para mostrarlo. Usamos el dominio sin
            cookies que YouTube ofrece para eso, pero la conexión existe y
            corresponde decirlo.
          </p>

          <h2>Medición de visitas y publicidad</h2>

          <p>
            <strong>Sí medimos cuántas visitas tiene el sitio, y lo hacemos sin
            cookies.</strong> Usamos Vercel Web Analytics, que cuenta páginas
            vistas, de dónde llegó cada visita y de qué país, sin guardar nada en
            tu navegador y sin seguirte a otros sitios. No hay perfil, no hay
            identificador y no se puede reconstruir quién sos a partir de eso.
          </p>

          <p>
            Elegimos ese servicio en lugar de Google Analytics justamente por
            eso: el de Google deja cookies y sigue a la misma persona entre
            sitios distintos, y para contar visitas de un diario chico no hace
            falta.
          </p>

          <p>
            <strong>Publicidad todavía no hay.</strong> Cuando la haya, va a ser
            de comercios que contratan el espacio directo con el medio: una
            imagen, un link y una fecha, sin cookies ni seguimiento. Si alguna
            vez entrara una red de publicidad que sí las use,{' '}
            <strong>esta página se actualiza antes</strong> de que empiece a
            funcionar, y va a decir qué servicio es, qué cookies deja y cómo
            rechazarlas.
          </p>

          <h2>Derechos</h2>

          <p>
            Cualquier persona puede pedir acceder a los datos personales que
            tengamos sobre ella, pedir que se corrijan si están mal o que se
            borren. Se pide por mail a{' '}
            <a href={`mailto:${MAIL_DEL_MEDIO}`}>{MAIL_DEL_MEDIO}</a> y se
            responde en un plazo razonable.
          </p>

          <p>
            Vale aclarar lo obvio y lo importante: el sitio no arma una base de
            datos de sus lectores, así que en la mayoría de los casos la
            respuesta va a ser que no hay nada guardado.
          </p>

          <h2>Si aparecés en una nota</h2>

          <p>
            El medio publica información sobre partidos de fútbol: nombres de
            jugadoras, goles, formaciones y fotos de los encuentros. Eso es
            periodismo deportivo y se publica por interés informativo. Si algo
            sobre vos está mal —un nombre mal escrito, un dato equivocado, una
            foto que no querés que esté— escribinos a{' '}
            <a href={`mailto:${MAIL_DEL_MEDIO}`}>{MAIL_DEL_MEDIO}</a> y lo
            revisamos.
          </p>

          <h2>Cambios</h2>

          <p>
            Cuando esta política cambie, cambia la fecha de arriba. Los cambios
            que afecten a lo que se recoge se avisan en la página antes de
            aplicarlos.
          </p>
        </div>
      </main>

      <Footer />
    </>
  )
}
