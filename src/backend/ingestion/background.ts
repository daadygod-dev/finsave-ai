import { randomUUID } from 'node:crypto'

type BackgroundTask = {
  id: string
  name: string
  run: () => Promise<void>
}

/**
 * Schedules best-effort in-process work after the HTTP response has been
 * handed to Fastify. Tasks are deliberately isolated so an ingestion failure
 * is logged without becoming an unhandled rejection.
 *
 * This is an MVP execution queue, not durable job infrastructure: a Cloud Run
 * instance can stop after returning a response. Production deployments must
 * replace this with a durable queue (for example Cloud Tasks) before relying
 * on accepted ingestion requests for guaranteed processing.
 */
export function enqueueBackgroundTask(name: string, run: () => Promise<void>) {
  const task: BackgroundTask = { id: randomUUID(), name, run }

  setImmediate(() => {
    void task.run().catch((error: unknown) => {
      console.error({ err: error, taskId: task.id, task: task.name }, 'background_task_failed')
    })
  })

  return task.id
}
