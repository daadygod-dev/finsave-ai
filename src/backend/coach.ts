/**
 * AI financial coach service.
 *
 * Analyzes the authenticated user's real data (recent transactions, goals,
 * credit score, monthly surplus) and returns plain-language insights. Groq
 * enriches the wording when configured; otherwise (or on any LLM failure)
 * the deterministic insights built from the real numbers are returned — the
 * numbers themselves never come from the LLM.
 */
import { prisma } from './db/client'
import { computeGoalFeasibility } from './goals/feasibility'
import { estimateMonthlySurplus } from './goals/surplus'
import { chatCompletion, getGroqConfig, type GroqConfig } from './llm/groq'

export type CoachInsight = {
  id: string
  type: 'summary' | 'warning' | 'savings' | 'goal' | 'credit'
  title: string
  body: string
  tone: 'info' | 'success' | 'warning'
}

const DAY_MS = 1000 * 60 * 60 * 24

const CATEGORY_LABELS: Record<string, string> = {
  food: 'food & market',
  transport: 'transport',
  mobile_money: 'mobile money fees',
  utilities: 'utilities',
  rent: 'rent',
  income: 'income',
  uncategorized: 'uncategorized spending',
}

function scoreBandLabel(score: number): string {
  if (score >= 720) return 'Strong'
  if (score >= 640) return 'Good'
  if (score >= 540) return 'Fair'
  return 'Building'
}

function formatRwf(minor: bigint): string {
  const sign = minor < 0n ? '-' : ''
  const absolute = minor < 0n ? -minor : minor
  return `${sign}${absolute.toLocaleString('en-US')} RWF`
}

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ')
}

export async function generateCoachInsights(userId: string): Promise<CoachInsight[]> {
  const since30 = new Date(Date.now() - 30 * DAY_MS)

  const [transactions30, goals, latestScore, surplus] = await Promise.all([
    prisma.transaction.findMany({
      where: { account: { userId }, occurredAt: { gte: since30 } },
      select: { amountMinor: true, category: true },
    }),
    prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { targetDate: 'asc' },
      select: {
        id: true,
        name: true,
        targetMinor: true,
        savedMinor: true,
        targetDate: true,
      },
    }),
    prisma.creditScore.findFirst({
      where: { businessId: userId },
      orderBy: { computedAt: 'desc' },
    }),
    estimateMonthlySurplus(userId),
  ])

  let income30 = 0n
  let spending30 = 0n
  const byCategory = new Map<string, bigint>()

  for (const transaction of transactions30) {
    if (transaction.amountMinor > 0n) {
      income30 += transaction.amountMinor
    } else {
      const absolute = -transaction.amountMinor
      spending30 += absolute
      byCategory.set(transaction.category, (byCategory.get(transaction.category) ?? 0n) + absolute)
    }
  }

  const avgIncomeMinor = BigInt(surplus.avgMonthlyIncomeMinor)
  const avgEssentialMinor = BigInt(surplus.avgMonthlyEssentialSpendingMinor)
  const surplusMinor = avgIncomeMinor - avgEssentialMinor

  const insights: CoachInsight[] = []

  if (income30 > 0n || spending30 > 0n) {
    const top = [...byCategory.entries()].sort((a, b) => Number(b[1] - a[1]))[0]
    insights.push({
      id: 'monthly-summary',
      type: 'summary',
      tone: 'info',
      title: 'Your month at a glance',
      body: `In the last 30 days you received ${formatRwf(income30)} and spent ${formatRwf(
        spending30,
      )}${top ? ` — ${categoryLabel(top[0])} was your biggest expense at ${formatRwf(top[1])}.` : '.'}`,
    })
  }

  if (income30 > 0n && spending30 * 100n > income30 * 85n) {
    insights.push({
      id: 'spending-warning',
      type: 'warning',
      tone: 'warning',
      title: 'Spending is running high',
      body: `You spent ${Math.min(
        100,
        Math.round((Number(spending30) * 100) / Number(income30)),
      )}% of your income in the last 30 days. Keeping it under 80% protects your cash flow and credit standing.`,
    })
  }

  if (surplusMinor > 0n) {
    insights.push({
      id: 'monthly-surplus',
      type: 'savings',
      tone: 'success',
      title: 'You have room to save',
      body: `After essentials, your cash flow supports saving about ${formatRwf(surplusMinor)} per month.`,
    })
  } else if (transactions30.length > 0) {
    insights.push({
      id: 'no-surplus',
      type: 'savings',
      tone: 'warning',
      title: 'No monthly surplus yet',
      body: 'Essentials are absorbing your income. Trim a non-essential category to free up room for savings.',
    })
  }

  const nextGoal = goals[0]
  if (nextGoal) {
    const feasibility = computeGoalFeasibility({
      targetMinor: nextGoal.targetMinor,
      savedMinor: nextGoal.savedMinor,
      targetDate: nextGoal.targetDate,
      avgMonthlyIncomeMinor: surplus.avgMonthlyIncomeMinor,
      avgMonthlyEssentialSpendingMinor: surplus.avgMonthlyEssentialSpendingMinor,
    })
    const due = nextGoal.targetDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })

    if (feasibility.feasible) {
      insights.push({
        id: 'goal-on-track',
        type: 'goal',
        tone: 'success',
        title: `"${nextGoal.name}" is on track`,
        body: `Saving ${formatRwf(BigInt(feasibility.monthlyTargetMinor))} per month reaches your ${formatRwf(
          BigInt(nextGoal.targetMinor),
        )} target by ${due}.`,
      })
    } else if (feasibility.suggestion === 'extend_timeline' && feasibility.suggestedMonths) {
      insights.push({
        id: 'goal-needs-time',
        type: 'goal',
        tone: 'warning',
        title: `"${nextGoal.name}" needs a longer runway`,
        body: `At your current surplus, plan for ${feasibility.suggestedMonths} months instead of ${feasibility.monthsRemaining} to reach ${formatRwf(BigInt(nextGoal.targetMinor))}.`,
      })
    } else {
      insights.push({
        id: 'goal-too-high',
        type: 'goal',
        tone: 'warning',
        title: `"${nextGoal.name}" is above your current cash flow`,
        body: 'Your surplus can’t cover the monthly saving this target needs — reduce the target or grow income first.',
      })
    }
  }

  if (latestScore) {
    const factors = (latestScore.factorsJson ?? {}) as {
      cashFlowConsistency?: number
      expenseRatio?: number
    }
    const consistency = factors.cashFlowConsistency ?? 0
    const expenseRatio = factors.expenseRatio ?? 0

    let lever: string
    if (consistency < 50) {
      lever =
        'Irregular cash flow is holding the score back — smoothing monthly income lifts it fastest.'
    } else if (expenseRatio > 0.7) {
      lever = `Expenses are ${Math.min(100, Math.round(
        expenseRatio * 100,
      ))}% of income — keeping spending under 70% of income is the fastest lever.`
    } else {
      lever = 'Healthy cash flow and a strong surplus ratio — keep the current behavior steady.'
    }

    insights.push({
      id: 'credit-focus',
      type: 'credit',
      tone: 'info',
      title: `Score ${latestScore.score} — ${scoreBandLabel(latestScore.score)}`,
      body: lever,
    })
  }

  const groqConfig = getGroqConfig()
  if (groqConfig && insights.length > 0) {
    const enriched = await enrichWithGroq(groqConfig, insights)
    if (enriched) return enriched
  }

  return insights
}

async function enrichWithGroq(config: GroqConfig, insights: CoachInsight[]): Promise<CoachInsight[] | null> {
  const prompt = [
    'You are FinSave AI\'s financial coach for Rwandan MSME owners.',
    'Rewrite these insights in warm, plain English. Keep every number exactly as given.',
    'Respond as JSON: {"insights":[{"id":"...","type":"...","title":"...","body":"...","tone":"info|success|warning"}]}',
    'Current insights:',
    insights.map((insight) => JSON.stringify(insight)).join('\n'),
  ].join('\n')

  try {
    const raw = await chatCompletion(
      config,
      [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Write the insights.' },
      ],
      true,
    )

    const parsed = JSON.parse(raw) as { insights?: CoachInsight[] }

    if (!Array.isArray(parsed.insights) || parsed.insights.length === 0) return null

    return parsed.insights
  } catch {
    return null
  }
}
