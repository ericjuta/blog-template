export type ClientErrorSource = "react-boundary" | "window-error" | "unhandledrejection"

export type ClientErrorRecord = {
  id: string
  source: ClientErrorSource
  boundary?: string
  message: string
  stack?: string
  componentStack?: string
  route: string
  timestamp: string
}

const MAX_RECENT_ERRORS = 50
const errorBuffer: Array<ClientErrorRecord> = []
let nextErrorIndex = 0
let errorSequence = 0

function snapshotRecentErrors(): Array<ClientErrorRecord> {
  // Once full, the next write will overwrite the oldest entry.
  const oldest = errorBuffer.length === MAX_RECENT_ERRORS ? nextErrorIndex : 0
  return errorBuffer.slice(oldest).concat(errorBuffer.slice(0, oldest))
}

function mirrorRecentErrors(): void {
  if (typeof window !== "undefined") {
    const browser = window as Window & { __REA_ERRORS__?: Array<ClientErrorRecord> }
    browser.__REA_ERRORS__ = snapshotRecentErrors()
  }
}

mirrorRecentErrors()

type ErrorLike = {
  message?: string
  stack?: string
}

function readErrorProperty(value: unknown, key: "message" | "stack"): string | undefined {
  if (value instanceof Error) {
    return key === "message" ? value.message : value.stack
  }
  if (typeof value !== "object" || value === null || !(key in value)) {
    return undefined
  }

  try {
    const candidate: ErrorLike = value
    const property = candidate[key]
    return typeof property === "string" ? property : undefined
  } catch {
    // Getters and proxies on arbitrary thrown values can throw as well.
    return undefined
  }
}

function describeError(value: unknown): string {
  const message = readErrorProperty(value, "message")
  if (message !== undefined) {return message}

  try {
    return String(value)
  } catch {
    return "Unknown error"
  }
}

function sendErrorBeacon(record: ClientErrorRecord): void {
  const reportUrl: unknown = import.meta.env?.VITE_ERROR_REPORT_URL
  if (typeof reportUrl !== "string" || typeof navigator === "undefined") {return}

  const url = reportUrl.trim()
  if (!url || typeof navigator.sendBeacon !== "function") {return}

  try {
    navigator.sendBeacon(url, JSON.stringify(record))
  } catch {
    // Transport failures should not prevent local reporting or create another error.
  }
}

export function reportClientError(input: {
  source: ClientErrorSource
  error: unknown
  boundary?: string
  componentStack?: string
}): ClientErrorRecord {
  const { source, error, boundary, componentStack } = input
  const now = new Date()
  const message = describeError(error)
  const stack = readErrorProperty(error, "stack")
  const record: ClientErrorRecord = {
    id: `${now.getTime()}-${++errorSequence}`,
    source,
    message,
    route: typeof window !== "undefined" ? window.location.pathname : "/",
    timestamp: now.toISOString(),
  }
  if (boundary !== undefined) {
    record.boundary = boundary
  }
  if (stack !== undefined) {
    record.stack = stack
  }
  if (componentStack !== undefined) {
    record.componentStack = componentStack
  }

  errorBuffer[nextErrorIndex] = record
  nextErrorIndex = (nextErrorIndex + 1) % MAX_RECENT_ERRORS
  mirrorRecentErrors()

  sendErrorBeacon(record)
  return record
}

export function getRecentErrors(): ReadonlyArray<ClientErrorRecord> {
  return snapshotRecentErrors()
}

export function clearRecentErrors(): void {
  errorBuffer.length = 0
  nextErrorIndex = 0
  mirrorRecentErrors()
}

function handleWindowError(event: ErrorEvent): void {
  reportClientError({ source: "window-error", error: event.error ?? event.message })
}

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  reportClientError({ source: "unhandledrejection", error: event.reason })
}

export function installGlobalErrorHandlers(): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }
  const browser = window

  browser.addEventListener("error", handleWindowError)
  browser.addEventListener("unhandledrejection", handleUnhandledRejection)
  return () => {
    browser.removeEventListener("error", handleWindowError)
    browser.removeEventListener("unhandledrejection", handleUnhandledRejection)
  }
}
