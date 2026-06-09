type LoadingSnapshot = {
  activeRequests: number
  isLoading: boolean
}

let activeRequests = 0
let snapshot: LoadingSnapshot = {
  activeRequests: 0,
  isLoading: false,
}
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

function updateSnapshot() {
  snapshot = {
    activeRequests,
    isLoading: activeRequests > 0,
  }
}

export function subscribeLoading(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getLoadingSnapshot(): LoadingSnapshot {
  return snapshot
}

export function startLoading() {
  activeRequests += 1
  updateSnapshot()
  notify()
}

export function stopLoading() {
  const nextActiveRequests = Math.max(0, activeRequests - 1)
  if (nextActiveRequests === activeRequests) return
  activeRequests = nextActiveRequests
  updateSnapshot()
  notify()
}

export function withLoading<T>(promise: Promise<T>): Promise<T> {
  startLoading()
  return promise.finally(() => stopLoading())
}
