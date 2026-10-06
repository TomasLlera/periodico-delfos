import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { openGraphBase } from '@/lib/seo'
import { MAIL_DEL_MEDIO, urlDelSitio } from '@/lib/sitio'

/**
 * La política de privacidad.
 *
 * **El texto es el que escribió y firmó el responsable del medio.** La primera
 * versión se redactó acá describiendo lo que el sitio hace —ésa era la única
 * forma de no inventar un documento legal—, y Charlie la revisó y la devolvió
 * corregida el 06/10/2026: sumó el marco legal argentino (Ley 25.326 y la
 * AAIP), el apartado de enlaces externos y botones de compartir, y el párrafo
 * sobre qué pasa con los mails que le escriben. Eso que agregó es suyo y no se
 * toca sin preguntarle.
 *
 * **Lo que sí hay que sostener desde el código es que cada afirmación siga
 * siendo cierta.** Están verificadas una por una:
 *
 * - **Cookies: ninguna en el sitio público.** El middleware que refresca la
 *   sesión de Supabase corre con `matcher: ['/admin/:path*']`, así que un lector
 *   no recibe ni una cookie. Si ese matcher cambia, esta página miente.
 * - **La preferencia de tema** la guarda `next-themes` en `localStorage` con la
 *   clave `tema`. No es una cookie y no viaja en ningún pedido.
 * - **Analítica: Vercel Web Analytics, sin cookies.** Google Analytics sigue
 *   apagado —`<Analitica />` no inyecta nada sin `NEXT_PUBLIC_GA_ID`, y la
 *   variable no está cargada— y se descartó por lo contrario: deja cookies.
 * - **Botones de compartir**: `<BotonesCompartir />` arma links a WhatsApp, X y
 *   Facebook. Son links, no scripts de esas plataformas.
 * - **Publicidad: ninguna al aire.** Los sponsors propios ya están programados
 *   —imagen, link y vigencia, sin cookies— y es lo que esta página describe.
 * - **YouTube** sólo aparece si una nota tiene un video, y va al dominio
 *   `youtube-nocookie.com`, diferido.
 *
 * **El orden es el que importa y el que hay que repetir**: el medidor de Vercel
 * entró el 06/10 y esta página lo declaró en el mismo commit. Una política que
 * declara lo que todavía no existe es tan falsa como una que esconde lo que ya
 * está andando. Si mañana entra AdSense —que sí deja cookies de terceros— se
 * actualiza acá **antes** de prenderlo.
 *
 * El nombre, el CUIT y el mail no están escritos adentro del texto: salen de
 * constantes, para que no queden dos versiones del mismo dato el día que alguno
 * cambie. El domicilio particular no se publica, y está razonado en `CUIT`.
 */
const SITE_URL = urlDelSitio()

const DESCRIPCION =
  'Qué datos recoge Periódico Delfos y qué no: el sitio público no usa cookies y la medición de visitas funciona sin ellas.'

/** La fecha de esta versión del documento. Se cambia cuando cambia el texto. */
const ACTUALIZADA = 'Octubre de 2026'

const RESPONSABLE = 'Carlos Rogelio Redondo'

/**
 * El CUIT del responsable, que lo pasó él el 06/10/2026.
 *
 * **Su domicilio particular no se publica, y es una decisión.** Lo mandó junto
 * con el nombre y el CUIT, pero una política de privacidad queda indexada para
 * siempre y la leen los robots que juntan datos: un domicilio personal
 * publicado no se puede despublicar, porque para cuando alguien se arrepiente
 * ya está copiado en otro lado. Nombre, CUIT y un mail de contacto identifican
 * al responsable igual de bien. Lo revisó con el documento delante y lo dejó
 * así.
 */
const CUIT = '20-38006487-2'

/** La ley argentina de protección de datos personales, y su órgano de control. */
const LEY = 'Ley N° 25.326'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: DESCRIPCION,
  alternates: { canonical: `${SITE_URL}/privacidad` },
  openGraph: {
    ...openGraphBase({ titulo: 'Política de privacidad', descripcion: DESCRIPCION }, SITE_URL),
    type: 'website',
  },
}

/** El mail, siempre como link: es por donde se ejercen los derechos. */
function Mail() {
  return <a href={`mailto:${MAIL_DEL_MEDIO}`}>{MAIL_DEL_MEDIO}</a>
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
            consulta relacionada con esta política: <Mail />
          </p>

          <h2>Qué datos recogemos de quien lee</h2>

          <p>
            <strong>Ninguno que lo identifique.</strong> El sitio no pide
            registrarse, no tiene formularios, no tiene comentarios y no tiene
            lista de correo. No hace falta dar ningún dato para leer nuestro
            contenido.
          </p>

          <p>
            Si nos escribís por correo electrónico a <Mail />, usaremos tu
            dirección y los datos que nos proporciones únicamente para responder
            a tu consulta. No los almacenaremos en bases de datos comerciales ni
            los compartiremos con terceros.
          </p>

          <h2>Cookies y almacenamiento local</h2>

          <p>
            <strong>El sitio público no usa cookies</strong>, ni propias ni de
            terceros. La medición de visitas que hacemos funciona sin ellas y
            está explicada más abajo.
          </p>

          <p>
            Lo único que queda guardado en el navegador es la preferencia de tema
            —claro u oscuro— si alguien toca ese botón. Se guarda en el
            almacenamiento local (<span className="dato">localStorage</span>) del
            propio navegador, no viaja a ningún servidor y se borra limpiando los
            datos del sitio desde tu navegador.
          </p>

          <p>
            Quienes escriben en el medio acceden a un panel de administración con
            usuario y contraseña, y en ese apartado sí existen cookies de sesión.
            Son estrictamente necesarias para mantener la sesión abierta y no
            afectan a quien solo lee la página.
          </p>

          <h2>Qué ven los servicios que hacen funcionar el sitio</h2>

          <p>
            Como en cualquier página de internet, los servidores que entregan
            este sitio registran de forma automática los pedidos que reciben
            (incluyendo la dirección IP y el tipo de navegador) para garantizar
            el correcto funcionamiento técnico y prevenir abusos o ataques.
            Usamos dos proveedores de infraestructura: <strong>Vercel</strong>,
            que publica la página web, y <strong>Supabase</strong>, donde se
            alojan las notas, las imágenes y los datos de los partidos. Nosotros
            no utilizamos esos registros para perfilar a nadie.
          </p>

          <p>
            Si una nota incluye un video de YouTube embebido, al abrir la nota el
            navegador se conecta a los servidores de YouTube para reproducirlo.
            Utilizamos el dominio extendido sin cookies que YouTube ofrece para
            este fin (<span className="dato">youtube-nocookie.com</span>), pero
            la conexión técnica existe y corresponde informar sobre ella.
          </p>

          <h2>Enlaces externos y botones de compartir</h2>

          <p>
            El sitio incluye enlaces a redes sociales y botones para compartir
            contenido en plataformas como WhatsApp, X o Facebook. Al hacer clic
            en estos enlaces, abandonás Periódico Delfos y la interacción pasa a
            regirse por las políticas de privacidad de cada una de esas
            plataformas.
          </p>

          <h2>Medición de visitas y publicidad</h2>

          <p>
            <strong>Sí medimos cuántas visitas tiene el sitio, y lo hacemos sin
            cookies.</strong> Usamos Vercel Web Analytics, que cuenta páginas
            vistas, la página de origen y el país de la visita, sin guardar nada
            en tu navegador y sin rastrearte en otros sitios. No genera perfiles,
            no crea identificadores y no permite reconstruir quién sos a partir
            de esa información.
          </p>

          <p>
            Elegimos este servicio por sobre Google Analytics justamente por eso:
            el servicio de Google utiliza cookies y realiza un seguimiento entre
            distintos sitios web, algo que para medir la audiencia de un diario
            independiente no resulta necesario.
          </p>

          <p>
            <strong>Publicidad de red actualmente no hay.</strong> Cuando
            incorporemos anunciantes, serán comercios o marcas que contratan el
            espacio de forma directa con el medio (una imagen con un enlace y un
            plazo de publicación), sin cookies ni scripts de seguimiento. Si en
            el futuro integráramos alguna red publicitaria que sí las utilice,
            esta página se actualizará antes de su implementación, detallando qué
            servicio es, qué cookies emplea y cómo rechazarlas.
          </p>

          <h2>Derechos y marco legal</h2>

          <p>
            Garantizamos el ejercicio de los derechos de acceso, rectificación,
            actualización y supresión de datos personales reconocidos por la{' '}
            {LEY} de Protección de Datos Personales de la República Argentina.
            Cualquier solicitud en este sentido puede enviarse por correo
            electrónico a <Mail /> y será respondida en un plazo razonable.
          </p>

          <p>
            Vale aclarar que, al no construir bases de datos de nuestros
            lectores, en la inmensa mayoría de los casos la respuesta será que no
            existe información personal almacenada.
          </p>

          <p>
            Se informa a los usuarios que la Agencia de Acceso a la Información
            Pública (AAIP), en su carácter de Órgano de Control de la {LEY},
            tiene la atribución de atender las denuncias y reclamos que se
            interpongan con relación al incumplimiento de las normas sobre
            protección de datos personales.
          </p>

          <h2>Si aparecés en una nota</h2>

          <p>
            El medio publica información sobre partidos de fútbol y actualidad
            local: nombres de jugadoras, goles, formaciones, listas de convocadas
            y fotografías de los encuentros. Esta cobertura responde al ejercicio
            del periodismo informativo e interés público deportivo.
          </p>

          <p>
            Si algún dato sobre vos está equivocado (un nombre mal escrito, una
            estadística incorrecta) o considerás que una imagen debe ser
            revisada, escribinos a <Mail /> para que lo analicemos y apliquemos
            la corrección correspondiente.
          </p>

          <h2>Cambios en esta política</h2>

          <p>
            Cualquier modificación futura en esta política se reflejará en la
            fecha de actualización indicada al inicio. Si se realizaran cambios
            sustanciales sobre la forma en que se recopila información, se
            avisará destacadamente en el sitio antes de su entrada en vigencia.
          </p>
        </div>
      </main>

      <Footer />
    </>
  )
}
