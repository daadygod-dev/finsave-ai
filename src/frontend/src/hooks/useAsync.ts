import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'

type AsyncState<T> = {
  data: T | null
  error: ApiError | null
  loading: boolean
}

/**
 * Data-fetching hook with loading/error state and a reload trigger.
 *
 * `fn` should be memoized by the caller (useCallback) so it is stable; the
 * second argument mirrors that function's dependencies.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: ReadonlyArray<unknown> = []) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true })
  const mountedRef = useRef(true)
  const nonceRef = useRef(0)

  const run = useCallback(() => {
    const nonce = ++nonceRef.current
    setState((current) => ({ ...current, loading: true, error: null }))

    fn().then(
      (data) => {
        if (mountedRef.current && nonce === nonceRef.current) {
          setState({ data, error: null, loading: false })
        }
      },
      (error: unknown) => {
        if (mountedRef.current && nonce === nonceRef.current) {
          setState({
            data: null,
            error: error instanceof ApiError ? error : new ApiError(0, 'network_error'),
            loading: false,
          })
        }
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    mountedRef.current = true
    run()
    return () => {
      mountedRef.current = false
      nonceRef.current += 1
    }
  }, [run])

  return { ...state, reload: run }
}
