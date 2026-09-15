/**
 * La bajada de la nota: el resumen escrito a mano que va debajo del título.
 *
 * Nunca es un extracto automático. En la base es `NOT NULL` con un constraint
 * de no vacía, y la migración deja en borrador las 43 notas de WordPress que
 * no traían una — es lo único que bloquea que se escriban.
 *
 * No usa `.prose-nota`: es más grande que el cuerpo y se lee de un vistazo, así
 * que lleva su propia medida, más corta.
 */

export function Bajada({ children }: { children: string }) {
  return (
    <p className="mt-4 max-w-[52ch] font-body text-[19px] leading-[1.55] text-gris md:text-[21px]">
      {children}
    </p>
  )
}
