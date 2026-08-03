import { describe, expect, it } from 'vitest'
import { scopeToSessionUser } from './scoping'

describe('scopeToSessionUser', () => {
  it('overrides client-supplied user identifiers with the verified session user', () => {
    expect(
      scopeToSessionUser(
        { user_id: 'attacker-user', userId: 'attacker-user', category: 'food' },
        'session-user',
      ),
    ).toMatchObject({
      user_id: 'session-user',
      userId: 'session-user',
      category: 'food',
    })
  })
})
