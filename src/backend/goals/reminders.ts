/**
 * Reminder selection for savings goals. Pure function so it is unit-testable
 * without a scheduler; a daily node-cron sweep (AGENTS.md §2 background
 * jobs) calls this and emits the messages. Wiring the cron is a deployment
 * concern and happens when the service is deployed to Cloud Run.
 */
export type GoalForReminder = {
  id: string
  name: string
  targetMinor: bigint
  savedMinor: bigint
  targetDate: Date
}

export type GoalReminder = {
  goalId: string
  message: string
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function goalsNeedingReminder(
  goals: GoalForReminder[],
  now: Date = new Date(),
): GoalReminder[] {
  const reminders: GoalReminder[] = []

  for (const goal of goals) {
    const remainingMinor = goal.targetMinor - goal.savedMinor

    if (remainingMinor <= 0n) continue

    const daysLeft = Math.max(
      0,
      Math.ceil((goal.targetDate.getTime() - now.getTime()) / MS_PER_DAY),
    )

    if (daysLeft === 0) {
      reminders.push({
        goalId: goal.id,
        message: `"${goal.name}" reaches its target date today — you still need to save ${remainingMinor.toString()} RWF. Consider reviewing the target or date.`,
      })
    } else if (daysLeft <= 7) {
      reminders.push({
        goalId: goal.id,
        message: `"${goal.name}" is due in ${daysLeft} day(s) with ${remainingMinor.toString()} RWF left to save.`,
      })
    }
  }

  return reminders
}
