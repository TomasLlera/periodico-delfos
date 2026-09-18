/**
 * El layout del banco de pruebas de la ventana.
 *
 * Existe sólo para tener el slot `@modal`: es la copia, dentro de `/demo/`, de
 * lo que el layout raíz hace para `/partido/[slug]`. Sin base, los chips de la
 * franja apuntan a partidos que no existen y la ventana de verdad no se puede
 * abrir ni una vez; acá los slugs son los del fixture demo y sí resuelven.
 *
 * El día que haya temporada cargada, esta carpeta entera se borra: lo que
 * prueba ya se puede mirar en `/`.
 */
export default function LayoutFixtureDemo({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
