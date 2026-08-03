import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/client'
import { computeGoalFeasibility } from '../goals/feasibility'
import { estimateMonthlySurplus } from '../goals/surplus'

const goalParamsSchema = z.object({
  id: z.string().uuid(),
})

const createGoalSchema = z.object({
  name: z.string().min(1).max(120),
  target_minor: z.coerce.bigint().positive(),
  target_date: z.string().datetime(),
})

const updateGoalSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    target_minor: z.coerce.bigint().positive().optional(),
    saved_minor: z.coerce.bigint().nonnegative().optional(),
    target_date: z.string().datetime().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'at least one field required',
  })

export async function registerGoalRoutes(app: FastifyInstance) {
  app.post(
    '/api/v1/goals',
    { preHandler: app.authenticateConsumer },
    async (request, reply) => {
      const userId = request.user!.id
      const body = createGoalSchema.parse(request.body)

      const targetDate = new Date(body.target_date)

      if (targetDate.getTime() <= Date.now()) {
        throw Object.assign(new Error('target_date_must_be_in_future'), { statusCode: 400 })
      }

      const goal = await prisma.savingsGoal.create({
        data: {
          userId,
          name: body.name,
          targetMinor: body.target_minor,
          targetDate,
        },
      })

      // Feasibility is advisory, never blocking — but it is always returned
      // so an unrealistic timeline surfaces a warning instead of being
      // silently accepted (PLANS.md Phase 3 verification).
      const surplus = await estimateMonthlySurplus(userId)
      const feasibility = computeGoalFeasibility({
        targetMinor: goal.targetMinor,
        savedMinor: goal.savedMinor,
        targetDate: goal.targetDate,
        avgMonthlyIncomeMinor: surplus.avgMonthlyIncomeMinor,
        avgMonthlyEssentialSpendingMinor: surplus.avgMonthlyEssentialSpendingMinor,
      })

      return reply.status(201).send({ goal: serializeGoal(goal), feasibility })
    },
  )

  app.get(
    '/api/v1/goals',
    { preHandler: app.authenticateConsumer },
    async (request) => {
      const userId = request.user!.id

      const [goals, surplus] = await Promise.all([
        prisma.savingsGoal.findMany({
          where: { userId },
          orderBy: { targetDate: 'asc' },
        }),
        estimateMonthlySurplus(userId),
      ])

      // Per-goal feasibility from the user's real cash flow, so the UI can
      // show whether each goal is achievable and what it needs monthly.
      const feasibility: Record<string, ReturnType<typeof computeGoalFeasibility>> = {}

      for (const goal of goals) {
        feasibility[goal.id] = computeGoalFeasibility({
          targetMinor: goal.targetMinor,
          savedMinor: goal.savedMinor,
          targetDate: goal.targetDate,
          avgMonthlyIncomeMinor: surplus.avgMonthlyIncomeMinor,
          avgMonthlyEssentialSpendingMinor: surplus.avgMonthlyEssentialSpendingMinor,
        })
      }

      return { goals: goals.map(serializeGoal), feasibility }
    },
  )

  app.patch(
    '/api/v1/goals/:id',
    { preHandler: app.authenticateConsumer },
    async (request) => {
      const userId = request.user!.id
      const { id } = goalParamsSchema.parse(request.params)
      const body = updateGoalSchema.parse(request.body)

      await assertGoalOwnership(id, userId)

      const goal = await prisma.savingsGoal.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.target_minor !== undefined ? { targetMinor: body.target_minor } : {}),
          ...(body.saved_minor !== undefined ? { savedMinor: body.saved_minor } : {}),
          ...(body.target_date !== undefined ? { targetDate: new Date(body.target_date) } : {}),
        },
      })

      return { goal: serializeGoal(goal) }
    },
  )

  app.delete(
    '/api/v1/goals/:id',
    { preHandler: app.authenticateConsumer },
    async (request, reply) => {
      const userId = request.user!.id
      const { id } = goalParamsSchema.parse(request.params)

      await assertGoalOwnership(id, userId)
      await prisma.savingsGoal.delete({ where: { id } })

      return reply.status(204).send()
    },
  )
}

async function assertGoalOwnership(goalId: string, userId: string) {
  const goal = await prisma.savingsGoal.findFirst({
    where: { id: goalId, userId },
    select: { id: true },
  })

  if (!goal) {
    throw Object.assign(new Error('goal_not_found'), { statusCode: 404 })
  }
}

function serializeGoal(goal: {
  id: string
  name: string
  targetMinor: bigint
  savedMinor: bigint
  currency: string
  targetDate: Date
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: goal.id,
    name: goal.name,
    targetMinor: goal.targetMinor.toString(),
    savedMinor: goal.savedMinor.toString(),
    currency: goal.currency,
    targetDate: goal.targetDate,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  }
}
