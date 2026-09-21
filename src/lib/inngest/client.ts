import { Inngest, eventType } from 'inngest'
import { z } from 'zod'

/**
 * El cliente de Inngest y los eventos que emite el proyecto.
 *
 * **Por qué hay una cola durable y no un `fetch` adentro del Server Action.**
 * Publicar una nota dispara tres posteos a tres APIs de terceros. Hacerlos
 * inline dejaría la publicación colgada de que Meta y X contesten —y Meta
 * tarda, y a veces no contesta—, con el agravante de que Vercel corta el
 * request a los pocos segundos: la nota quedaría publicada y los posteos a
 * medio hacer, sin nadie que los retome. El blueprint lo dice en una línea:
 * *"nada de posteo inline en el request"*.
 *
 * Lo que la cola agrega no es velocidad, es **poder reintentar sin duplicar**.
 * Eso no lo da Inngest: lo da `social_posts (nota_id, platform)` (regla no
 * negociable 5). Inngest reintenta, y el UNIQUE es lo que hace que reintentar
 * sea inofensivo.
 *
 * **Ojo con la versión.** El blueprint fue escrito contra Inngest 3, donde los
 * eventos se declaraban con `new EventSchemas().fromRecord<…>()`. La 4 —la que
 * está instalada— los declara con `eventType()` y un esquema de Standard
 * Schema, que Zod 4 cumple. Si algún ejemplo de la documentación no compila,
 * mirar la versión antes que el código.
 */

/**
 * Una nota pasó a publicada.
 *
 * Lleva el `notaId` y nada más: el resto se lee de la base adentro de la
 * función. Mandar la nota entera en el evento la congelaría en el momento del
 * disparo, y entre eso y el posteo puede haber un reintento de mañana con el
 * título ya corregido.
 *
 * El `slug` viaja igual, pero sólo para poder leer los logs de Inngest sin
 * abrir la base.
 */
export const notaPublicada = eventType('nota/publicada', {
  schema: z.object({
    notaId: z.string(),
    slug: z.string(),
  }),
})

export const inngest = new Inngest({ id: 'periodico-delfos' })
