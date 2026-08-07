/**
 * Settles `promise`, but rejects with a clear 504 `scoring_timeout` error if
 * it takes longer than `ms`. Used to keep DB-backed requests from hanging
 * until a proxy/Cloud Run timeout kills them.
 *
 * Note: the underlying promise keeps running server-side after the timeout
 * fires; a late settle is a silent no-op (never an unhandled rejection).
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error('scoring_timeout'), { statusCode: 504 }))
    }, ms)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}
