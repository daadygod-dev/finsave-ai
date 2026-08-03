import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { ZodError } from 'zod'
import { authenticateConsumer } from './auth/consumer'
import { registerAccountRoutes } from './routes/accounts'
import { registerCsvUploadRoutes } from './routes/csvUpload'
import { registerHealthRoutes } from './routes/health'
import { registerSessionRoutes } from './routes/session'
import { registerTransactionRoutes } from './routes/transactions'

type HttpError = Error & {
  statusCode?: number
}

export async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(cors, {
    origin: true,
    credentials: true,
  })

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.user?.id ?? request.ip,
  })

  app.decorateRequest('user', null)
  app.decorate('authenticateConsumer', authenticateConsumer)

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error)

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'validation_error',
        details: error.flatten(),
      })
    }

    const httpError = error as HttpError

    if (typeof httpError.statusCode === 'number') {
      return reply.status(httpError.statusCode).send({ error: httpError.message })
    }

    return reply.status(500).send({ error: 'internal_error' })
  })

  await registerHealthRoutes(app)
  await registerSessionRoutes(app)
  await registerAccountRoutes(app)
  await registerCsvUploadRoutes(app)
  await registerTransactionRoutes(app)

  return app
}
