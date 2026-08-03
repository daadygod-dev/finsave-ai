import { describe, expect, it } from 'vitest'
import { goalsNeedingReminder } from './reminders'

const now = new Date('2026-08-03T10:00:00.000Z')

describe('goalsNeedingReminder', () => {
  it('flags goals within a week of the target date', () => {
    const reminders = goalsNeedingReminder(
      [
        {
          id: 'goal-1',
          name: 'Laptop',
          targetMinor: 600000n,
          savedMinor: 300000n,
          targetDate: new Date('2026-08-06T00:00:00.000Z'),
        },
      ],
      now,
    )

    expect(reminders).toHaveLength(1)
    expect(reminders[0].goalId).toBe('goal-1')
    expect(reminders[0].message).toContain('Laptop')
  })

  it('ignores completed goals and goals far from the deadline', () => {
    const reminders = goalsNeedingReminder(
      [
        {
          id: 'done',
          name: 'Done',
          targetMinor: 100000n,
          savedMinor: 100000n,
          targetDate: new Date('2026-08-04T00:00:00.000Z'),
        },
        {
          id: 'far',
          name: 'Far away',
          targetMinor: 100000n,
          savedMinor: 0n,
          targetDate: new Date('2027-01-01T00:00:00.000Z'),
        },
      ],
      now,
    )

    expect(reminders).toHaveLength(0)
  })
})
