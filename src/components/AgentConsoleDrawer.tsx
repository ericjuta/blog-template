import { useEffect, useState } from "react"
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@ui-sdk/react/drawer"
import type { AgentComponent } from "@ui-sdk/react/agent"
import {
  getBlogAgent,
  readAgentState,
  recordEvent,
  resolveConfirmation,
  subscribeAgentState,
} from "../lib/blog-agent"

interface AgentConsoleDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentConsoleDrawer({
  open,
  onOpenChange,
}: AgentConsoleDrawerProps) {
  const [snapshot, setSnapshot] = useState<Array<AgentComponent>>([])
  const [agentState, setAgentState] = useState(() => readAgentState())
  const [statusMessage, setStatusMessage] = useState<string>("")

  const refreshSnapshot = () => {
    const agent = getBlogAgent()
    const next = agent.snapshot()
    setSnapshot(next)
    recordEvent({
      kind: "snapshot",
      summary: `Captured ${next.length} SDK components`,
      detail: next.map((c) => c.label || c.component).join(", "),
      ok: true,
    })
  }

  useEffect(() => {
    const sync = () => {
      setAgentState(readAgentState())
      if (open) {
        setSnapshot(getBlogAgent().snapshot())
      }
    }
    const timer = open ? window.setTimeout(sync, 0) : null
    const unsubscribe = subscribeAgentState(sync)
    return () => {
      if (timer !== null) {
        window.clearTimeout(timer)
      }
      unsubscribe()
    }
  }, [open])

  const runDemoAction = async (
    label: string,
    targetPattern: RegExp,
    action: string,
    args?: Array<unknown>
  ) => {
    const agent = getBlogAgent()
    const components = agent.snapshot()
    const match = components.find((c) =>
      targetPattern.test(String(c.label ?? ""))
    )
    if (!match) {
      setStatusMessage(
        `No mounted component matching ${targetPattern.source}. Open the featured report first.`
      )
      return
    }
    setStatusMessage(`Running "${label}" on ${match.label}...`)
    try {
      const steps =
        args !== undefined
          ? [{ ref: match.ref, action, args }]
          : [{ ref: match.ref, action }]
      const result = await agent.act({
        steps,
      })
      setSnapshot(agent.snapshot())
      recordEvent({
        kind: "act",
        summary: `${label} (${action})`,
        detail: `ref=${match.ref} ok=${result.ok}`,
        ok: result.ok,
      })
      setStatusMessage(
        result.ok ? `Completed "${label}".` : `Action "${label}" was declined or blocked.`
      )
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      recordEvent({
        kind: "act",
        summary: `${label} failed`,
        detail: msg,
        ok: false,
      })
      setStatusMessage(`Action "${label}" failed: ${msg}`)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="right">
      <DrawerBackdrop />
      <DrawerContent aria-label="UI SDK Agent Console">
        <div className="drawer-header">
          <div>
            <DrawerTitle style={{ margin: 0, fontSize: "1.05rem", color: "var(--ink)" }}>
              UI SDK Agent Bridge Console
            </DrawerTitle>
            <DrawerDescription
              style={{
                margin: "0.25rem 0 0",
                fontSize: "0.82rem",
                color: "var(--ink-muted)",
              }}
            >
              Live <code>createAgent()</code> snapshot, guided actions, and WebMCP status.
            </DrawerDescription>
          </div>
          <DrawerClose className="btn btn-sm btn-ghost" aria-label="Close Agent Console">
            Close
          </DrawerClose>
        </div>

        <div className="drawer-body">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 0.9rem",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="pill-badge pill-badge-neutral">
              WebMCP: {agentState.webMcpAvailable ? "Available" : "Console fallback"}
            </span>

            <button type="button" className="btn btn-sm" onClick={refreshSnapshot}>
              Refresh snapshot
            </button>
          </div>

          {agentState.pendingPrompt && (
            <div
              role="alert"
              style={{
                padding: "0.85rem",
                borderRadius: "var(--radius-sm)",
                background: "var(--warn-soft)",
                border: "1px solid var(--warn-border)",
                fontSize: "0.84rem",
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--warn)" }}>
                Approval required: {agentState.pendingPrompt.action}
              </div>
              <div style={{ color: "var(--ink-secondary)", margin: "0.25rem 0 0.6rem" }}>
                {agentState.pendingPrompt.message} (<code>{agentState.pendingPrompt.ref}</code>)
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => resolveConfirmation(true)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => resolveConfirmation(false)}
                >
                  Deny
                </button>
              </div>
            </div>
          )}

          <div>
            <div
              style={{
                fontSize: "0.76rem",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
                marginBottom: "0.45rem",
              }}
            >
              Guided Agent Actions
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  runDemoAction("Advance DX-Ball Stepper", /DX-Ball reconstruction/i, "next")
                }
              >
                Step DX-Ball → Next
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  runDemoAction(
                    "Jump DX-Ball to Step 5",
                    /DX-Ball reconstruction/i,
                    "goTo",
                    ["step-05"]
                  )
                }
              >
                DX-Ball → Step 5
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  runDemoAction(
                    "Switch Benchmark to Tool Calls",
                    /Benchmark metric/i,
                    "setValue",
                    ["toolCalls"]
                  )
                }
              >
                Benchmark → Tool Calls
              </button>
            </div>
            {statusMessage && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--accent-ink)" }}>
                {statusMessage}
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: "0.76rem",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
                marginBottom: "0.45rem",
              }}
            >
              Discovered SDK Components ({snapshot.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {snapshot.map((comp) => (
                <div
                  key={comp.ref}
                  style={{
                    padding: "0.55rem 0.7rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    fontSize: "0.78rem",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                    {comp.label || "(unnamed)"}
                  </div>
                  <div className="mono" style={{ color: "var(--ink-muted)", fontSize: "0.72rem" }}>
                    ref: {comp.ref} · component: {comp.component} · actions:{" "}
                    {comp.actions.join(", ") || "none"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "0.76rem",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
                marginBottom: "0.45rem",
              }}
            >
              Recent Agent Events ({agentState.history.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {agentState.history.length === 0 ? (
                <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>
                  No agent actions recorded yet. Click a guided action above.
                </div>
              ) : (
                agentState.history.slice(0, 8).map((ev) => (
                  <div
                    key={ev.id}
                    className="mono"
                    style={{
                      fontSize: "0.74rem",
                      padding: "0.45rem 0.6rem",
                      borderRadius: "4px",
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <strong>{ev.kind}</strong> · {ev.summary}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
