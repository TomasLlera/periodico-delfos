/**
 * El recuadro de aviso del panel: el estado vacío, la advertencia y el error.
 *
 * Es un Server Component: no tiene estado, lo dibujan páginas y formularios por
 * igual, y estaba copiado con tres bordes distintos en cuatro pantallas.
 *
 * **El tono se dice con la palabra y con el color, nunca con el color solo.**
 * Un borde rojo sin texto no lo lee un lector de pantalla ni se distingue en
 * escala de grises; por eso el error lleva `role="alert"` y los tres empiezan
 * por una frase que se entiende sin ver el borde.
 */

const ESTILO = {
  neutro: 'border-linea-fuerte bg-papel-alt',
  atencion: 'border-amarillo bg-papel-alt',
  error: 'border-roja bg-papel-alt',
} as const

export type TonoAviso = keyof typeof ESTILO

export function Aviso({
  tono = 'neutro',
  children,
}: {
  tono?: TonoAviso
  children: React.ReactNode
}) {
  return (
    <p
      role={tono === 'error' ? 'alert' : undefined}
      className={`border-l-2 px-4 py-3 text-[0.95rem] ${ESTILO[tono]}`}
    >
      {children}
    </p>
  )
}
