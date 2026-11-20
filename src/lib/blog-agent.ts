"use client"

import {
  agentTools,
  createAgent,
  registerTools,
} from "@ui-sdk/react/agent"

type BlogAgent = ReturnType<typeof createAgent>

type AgentEvent = {
  id: string
  time: string
  kind: "snapshot" | "act" | "query" | "confirm"
  summary: string
  detail: string
  ok: boolean
}

type PendingPrompt = {
  message: string
  ref: string
  action: string
}

type AgentListener = () => void

let pendingResolver: ((allowed: boolean) => void) | null = null
let pendingPrompt: PendingPrompt | null = null
const listeners = new Set<AgentListener>()
const history: AgentEvent[] = []
let seq = 0

function emit() {
  for (const listener of listeners) listener()
}

function recordEvent(event: Omit<AgentEvent, "id" | "time">) {
  seq += 1
  const time = new Date().toTimeString().slice(0, 8)
  history.unshift({ ...event, id: `ev-${seq}`, time })
  if (history.length > 30) history.length = 30
  emit()
}

function requestConfirmation(message: string, ref: string, action: string) {
  const { promise, resolve } = Promise.withResolvers<boolean>()
  pendingPrompt = { message, ref, action }
  pendingResolver = resolve
  recordEvent({
    kind: "confirm",
    summary: `Approval requested: ${action} on "${ref}"`,
    detail: message,
    ok: true,
  })
  emit()
  return promise
}

function resolveConfirmation(allowed: boolean) {
  const resolve = pendingResolver
  const prompt = pendingPrompt
  pendingResolver = null
  pendingPrompt = null
  if (prompt) {
    recordEvent({
      kind: "confirm",
      summary: allowed ? `Approved: ${prompt.action}` : `Declined: ${prompt.action}`,
      detail: prompt.message,
      ok: allowed,
    })
  }
  emit()
  resolve?.(allowed)
}

let sharedAgent: BlogAgent | null = null
let unregisterWebMcp: (() => void) | null = null

function getBlogAgent(): BlogAgent {
  if (!sharedAgent) {
    sharedAgent = createAgent({
      allow: (step) => {
        if (!step.confirm) return true
        return requestConfirmation(
          step.confirm,
          String(step.ref),
          String(step.action)
        )
      },
    })

    if (typeof window !== "undefined") {
      Object.assign(window, { reaBlogAgent: sharedAgent })
      unregisterWebMcp = registerTools(sharedAgent, { allow: () => true })
    }
  }
  return sharedAgent
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unregisterWebMcp?.()
  })
}

function subscribeAgentState(listener: AgentListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function readAgentState() {
  const webMcpAvailable =
    typeof document !== "undefined" &&
    typeof (
      document as Document & { modelContext?: { registerTool?: unknown } }
    ).modelContext?.registerTool === "function"
  return {
    history: [...history],
    pendingPrompt,
    webMcpAvailable,
  }
}

export {
  agentTools,
  getBlogAgent,
  readAgentState,
  recordEvent,
  resolveConfirmation,
  subscribeAgentState,
  type AgentEvent,
  type BlogAgent,
  type PendingPrompt,
}
