import { describe, expect, it } from 'vitest'
import { withTimeout } from './util'

describe('withTimeout', () => {
  it('resolves with the underlying value when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1_000)).resolves.toBe(42)
  })

  it('rejects with the underlying error when the promise fails in time', async () => {
    const failure = Object.assign(new Error('db_down'), { statusCode: 500 })
    await expect(withTimeout(Promise.reject(failure), 1_000)).rejects.toThrow('db_down')
  })

  it('rejects with a 504 scoring_timeout when the promise exceeds the budget', async () => {
    const slow = new Promise<never>((resolve) => setTimeout(resolve, 200))
    const error = await withTimeout(slow, 10).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('scoring_timeout')
    expect((error as { statusCode?: number }).statusCode).toBe(504)
  })
})
