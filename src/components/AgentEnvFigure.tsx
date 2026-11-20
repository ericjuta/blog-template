import { useState } from "react"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import { Switch, SwitchThumb } from "@ui-sdk/react/switch"

type EnvStage = "capture" | "compile" | "replay" | "grade"

type StageSpec = {
  id: EnvStage
  label: string
  command: string
  summary: string
  inputShape: string
  outputShape: string
  sideEffects: string
  samplePayload: string
}

const STAGES: Record<EnvStage, StageSpec> = {
  capture: {
    id: "capture",
    label: "1. Capture",
    command: "rea capture_browser_scenario --origin https://app.example.test",
    summary:
      "Record passive CDP network frames, DOM accessibility snapshots, and WebMCP tool declarations from a real session without mutating the target.",
    inputShape: "Live browser tab (CDP) or saved HAR / SAZ trace",
    outputShape: "Content-addressed Evidence bundle (SHA-256 manifest)",
    sideEffects: "Read-only observation",
    samplePayload: `{
  "evidence_id": "ev_cdp_0194",
  "origin": "https://app.example.test",
  "requests_captured": 18,
  "webmcp_tools": ["orders.list", "orders.cancel"],
  "bundle_sha256": "9f4b2c...e18a"
}`,
  },
  compile: {
    id: "compile",
    label: "2. Compile",
    command: "rea export_environment_bundle --out ./env-orders-v1",
    summary:
      "Synthesize an offline, deterministic tool server and mock state store from the captured Evidence bundle. Every HTTP/WebSocket transition is pinned by digest.",
    inputShape: "Authenticated capture Evidence JSON",
    outputShape: "Self-contained local environment folder + replay fixtures",
    sideEffects: "0 network calls",
    samplePayload: `{
  "env_id": "orders-v1",
  "routes_synthesized": 6,
  "state_transitions": 14,
  "deterministic_seed": 42,
  "live_egress": "blocked"
}`,
  },
  replay: {
    id: "replay",
    label: "3. Replay",
    command: "agent.act([{ ref: 'orders-table', action: 'cancel', args: ['ord_42'] }])",
    summary:
      "Run coding agents against the local harness via Vercel UI SDK snapshot()/act() or MCP tools. Agents explore, fail, and retry with zero production risk.",
    inputShape: "Agent policy + UI SDK / WebMCP bridge",
    outputShape: "Structured trajectory log + state diff",
    sideEffects: "0 live side effects (sandboxed memory)",
    samplePayload: `{
  "step": 3,
  "action": "orders.cancel(ord_42)",
  "latency_ms": 1.8,
  "network_egress": 0,
  "state_after": { "ord_42": "cancelled" }
}`,
  },
  grade: {
    id: "grade",
    label: "4. Grade",
    command: "rea verify_reconstruction --spec ./task-spec.json",
    summary:
      "Score the trajectory against exact terminal state assertions and residual-unknown checks. Only byte-stable, reproducible runs pass the gate.",
    inputShape: "Trajectory + final state + task spec",
    outputShape: "Deterministic pass/fail reward + diff report",
    sideEffects: "Pure local verification",
    samplePayload: `{
  "verdict": "PASS",
  "assertions_passed": "12 / 12",
  "unexpected_calls": 0,
  "tokens_used": 69500,
  "reproducible": true
}`,
  },
}

const STAGE_ORDER: EnvStage[] = ["capture", "compile", "replay", "grade"]

export function AgentEnvFigure() {
  const [stage, setStage] = useState<EnvStage>("capture")
  const [strictDeterminism, setStrictDeterminism] = useState(true)

  const current = STAGES[stage]

  return (
    <figure className="figure-card" aria-label="AgentEnv offline RL pipeline explorer">
      <div className="figure-header">
        <div>
          <p className="figure-kicker">Interactive Figure · AgentEnv Pipeline</p>
          <h3 className="figure-title">From Recorded Capture to Deterministic Offline Harness</h3>
        </div>
        <div className="figure-controls">
          <SegmentedControl
            aria-label="AgentEnv pipeline stage"
            value={stage}
            onValueChange={(next) => {
              if (next && next in STAGES) {
                setStage(next as EnvStage)
              }
            }}
          >
            <SegmentedControlIndicator />
            {STAGE_ORDER.map((id) => (
              <SegmentedControlItem key={id} value={id}>
                {STAGES[id].label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>

          <label className="switch-label">
            <Switch
              checked={strictDeterminism}
              onCheckedChange={setStrictDeterminism}
              aria-label="Enforce zero-egress determinism"
            >
              <SwitchThumb />
            </Switch>
            <span>Zero-egress mode</span>
          </label>
        </div>
      </div>

      <div className="figure-body">
        <p style={{ margin: "0 0 0.9rem", color: "var(--ink-secondary)" }}>{current.summary}</p>

        <div className="env-meta-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
          <div className="metric-tile" style={{ padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)" }}>
            <div className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>INPUT</div>
            <div style={{ fontSize: "0.88rem", marginTop: "0.2rem" }}>{current.inputShape}</div>
          </div>
          <div className="metric-tile" style={{ padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)" }}>
            <div className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>OUTPUT</div>
            <div style={{ fontSize: "0.88rem", marginTop: "0.2rem" }}>{current.outputShape}</div>
          </div>
          <div className="metric-tile" style={{ padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)" }}>
            <div className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>SIDE EFFECTS</div>
            <div style={{ fontSize: "0.88rem", marginTop: "0.2rem", color: strictDeterminism ? "var(--accent)" : "var(--ink)" }}>
              {strictDeterminism ? current.sideEffects : "Live passthrough enabled (unsafe for RL)"}
            </div>
          </div>
        </div>

        <div className="code-pane">
          <div className="code-pane-header">
            <span className="mono">{current.command}</span>
            <span className="pill-badge pill-badge-neutral">
              {strictDeterminism ? "deterministic" : "passthrough"}
            </span>
          </div>
          <pre style={{ margin: 0, padding: "0.9rem 1rem", overflowX: "auto", fontSize: "0.82rem", color: "#e2e8f0" }}>
            <code>{current.samplePayload}</code>
          </pre>
        </div>
      </div>

      <figcaption className="figure-caption">
        Every stage is inspectable via <code>blogAgent.snapshot()</code>. Toggle between stages or
        flip zero-egress mode to see how REA isolates agent rollouts from live systems.
      </figcaption>
    </figure>
  )
}
