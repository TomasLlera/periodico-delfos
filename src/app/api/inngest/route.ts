import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { postearNota } from '@/lib/inngest/funciones/nota-publicada'

/**
 * El endpoint que Inngest llama para correr las funciones.
 *
 * En el App Router hay que exportar los métodos sueltos —`GET`, `POST`,
 * `PUT`—, no el handler entero: `GET` y `PUT` son los que usa Inngest para
 * descubrir y registrar las funciones, y `POST` el que las ejecuta. Sin los
 * tres, el panel de Inngest muestra la app pero no encuentra ninguna función.
 *
 * **Esta ruta no está protegida por el middleware del admin, y no tiene que
 * estarlo**: la llama Inngest desde afuera, no un navegador con sesión. Lo que
 * la protege es la firma con `INNGEST_SIGNING_KEY`, que el SDK verifica solo
 * cuando la variable está puesta. En local, con `npx inngest-cli dev`, no hace
 * falta.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [postearNota],
})
