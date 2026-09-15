import { ImageResponse } from 'next/og'
import { NOMBRE_SITIO } from '@/lib/seo'

/**
 * La imagen de las tarjetas de redes, en 1200×630.
 *
 * Existe porque **la mayoría de las notas migradas no tiene imagen de portada**
 * y sin esto se comparten como un rectángulo gris con el dominio. Con esto, al
 * menos salen con el titular y la marca.
 *
 * Los colores van en hexadecimal y no en tokens del tema: esto es una imagen,
 * no una página. No hay `prefers-color-scheme` en una tarjeta de Twitter.
 *
 * El titular se recorta a 110 caracteres, que es cerca de donde cortan tanto
 * Google como las tarjetas de redes. El sitio viejo tiene títulos de 75+
 * caracteres con un sufijo de fecha y temporada, y esa es exactamente la parte
 * que se pierde.
 */
export const runtime = 'edge'

const VERDE = '#0F3B2A'
const AMARILLO = '#F2A900'
const LARGO_MAXIMO = 110

/** Recorta por palabra, no por carácter: cortar al medio se lee como un error. */
function recortar(texto: string, maximo = LARGO_MAXIMO): string {
  if (texto.length <= maximo) return texto

  const cortado = texto.slice(0, maximo)
  const ultimoEspacio = cortado.lastIndexOf(' ')
  return `${(ultimoEspacio > 0 ? cortado.slice(0, ultimoEspacio) : cortado).trimEnd()}…`
}

export function GET(request: Request): ImageResponse {
  const { searchParams } = new URL(request.url)
  const titulo = recortar(searchParams.get('titulo')?.trim() || NOMBRE_SITIO)
  const volanta = searchParams.get('volanta')?.trim()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: VERDE,
          padding: '72px 80px',
          color: '#FFFFFF',
        }}
      >
        {volanta ? (
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: AMARILLO,
              borderLeft: `8px solid ${AMARILLO}`,
              paddingLeft: 20,
            }}
          >
            {volanta}
          </div>
        ) : (
          <div style={{ display: 'flex' }} />
        )}

        <div
          style={{
            display: 'flex',
            fontSize: titulo.length > 70 ? 62 : 76,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
          }}
        >
          {titulo}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', width: 64, height: 8, background: AMARILLO }} />
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 700 }}>
            {NOMBRE_SITIO}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
