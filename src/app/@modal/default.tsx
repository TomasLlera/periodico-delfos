/**
 * El slot `@modal` cuando no hay ninguna ruta interceptada, que es casi
 * siempre: nada.
 *
 * **Sin este archivo el sitio se rompe al recargar.** Un slot paralelo sin
 * `default.tsx` no tiene qué renderizar en una navegación dura y Next tira 404
 * en rutas que existen. Que devuelva `null` es justamente el punto: el layout
 * raíz pone `{modal}` en todas las páginas y en todas, menos cuando se
 * interceptó un partido, eso no dibuja nada y no cuesta nada.
 */
export default function SinVentana() {
  return null
}
