import { useState } from "react"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import { Switch, SwitchThumb } from "@ui-sdk/react/switch"
import {
  UI_SDK_BENCHMARKS,
  type BenchmarkMetricKey,
  type BenchmarkRow,
} from "../data/blog-data"

const METRIC_META: Record<
  BenchmarkMetricKey,
  {
    label: string
    subtitle: string
    format: (v: number) => string
    getBase: (r: BenchmarkRow) => number
    getBridge: (r: BenchmarkRow) => number
  }
> = {
  tokensK: {
    label: "Tokens",
    subtitle: "Median total tokens in thousands across 3 runs (lower is better)",
    format: (v) => `${v.toFixed(1)}k`,
    getBase: (r) => r.competitorTokensK,
    getBridge: (r) => r.uiSdkTokensK,
  },
  toolCalls: {
    label: "Tool calls",
    subtitle: "Median tool invocations per task across 3 runs (lower is better)",
    format: (v) => `${v} calls`,
    getBase: (r) => r.competitorToolCalls,
    getBridge: (r) => r.uiSdkToolCalls,
  },
  timeSec: {
    label: "Wall time",
    subtitle: "Median end-to-end completion time in seconds (lower is better)",
    format: (v) => `${v} s`,
    getBase: (r) => r.competitorTimeSec,
    getBridge: (r) => r.uiSdkTimeSec,
  },
  costUsd: {
    label: "Cost",
    subtitle: "Median API cost in USD across 3 runs (lower is better)",
    format: (v) => `$${v.toFixed(3)}`,
    getBase: (r) => r.competitorCostUsd,
    getBridge: (r) => r.uiSdkCostUsd,
  },
}

export function BenchmarkFigure() {
  const [metric, setMetric] = useState<BenchmarkMetricKey>("tokensK")
  const [logScale, setLogScale] = useState(false)
  const [showDelta, setShowDelta] = useState(true)

  const meta = METRIC_META[metric]
  const maxRaw = Math.max(
    ...UI_SDK_BENCHMARKS.flatMap((row) => [meta.getBase(row), meta.getBridge(row)])
  )

  const scaleWidth = (val: number): number => {
    if (logScale) {
      return (Math.log10(val + 1) / Math.log10(maxRaw + 1)) * 100
    }
    return (val / maxRaw) * 100
  }

  return (
    <figure className="figure-card" aria-labelledby="fig-bench-title">
      <div className="figure-header">
        <div>
          <div className="figure-label">Figure 2 · Agent Bridge Benchmark</div>
          <h3 id="fig-bench-title" className="figure-title">
            Browser-Only vs. UI SDK Agent Bridge (3-Run Medians)
          </h3>
        </div>

        <SegmentedControl
          aria-label="Benchmark metric selector"
          value={metric}
          onValueChange={(v) => setMetric(v as BenchmarkMetricKey)}
        >
          <SegmentedControlIndicator />
          <SegmentedControlItem value="tokensK">Tokens</SegmentedControlItem>
          <SegmentedControlItem value="toolCalls">Tool calls</SegmentedControlItem>
          <SegmentedControlItem value="timeSec">Wall time</SegmentedControlItem>
          <SegmentedControlItem value="costUsd">Cost</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="figure-body">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1.1rem",
          }}
        >
          <span style={{ fontSize: "0.84rem", color: "var(--ink-secondary)" }}>
            {meta.subtitle}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "1.1rem" }}>
            <label className="switch-label">
              <Switch
                checked={logScale}
                onCheckedChange={setLogScale}
                aria-label="Toggle logarithmic chart scale"
              >
                <SwitchThumb />
              </Switch>
              <span>Log scale</span>
            </label>

            <label className="switch-label">
              <Switch
                checked={showDelta}
                onCheckedChange={setShowDelta}
                aria-label="Show percentage reduction badges"
              >
                <SwitchThumb />
              </Switch>
              <span>Show delta</span>
            </label>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {UI_SDK_BENCHMARKS.map((row) => {
            const baseVal = meta.getBase(row)
            const bridgeVal = meta.getBridge(row)

            return (
              <div
                key={row.framework}
                style={{
                  padding: "0.8rem 0.9rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <strong style={{ fontSize: "0.9rem", color: "var(--ink)" }}>
                    {row.frameworkLabel}
                  </strong>
                  {showDelta && (
                    <span className="pill-badge pill-badge-success">
                      {row.deltas[metric]}
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gap: "0.45rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "155px 1fr 78px",
                      alignItems: "center",
                      gap: "0.6rem",
                      fontSize: "0.78rem",
                    }}
                  >
                    <span style={{ color: "var(--ink-muted)" }}>{row.competitor}</span>
                    <div
                      style={{
                        height: "14px",
                        background: "#e2e8f0",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${scaleWidth(baseVal)}%`,
                          height: "100%",
                          background: "#64748b",
                          borderRadius: "3px",
                          transition: "width 200ms ease",
                        }}
                      />
                    </div>
                    <span className="mono" style={{ textAlign: "right", color: "var(--ink)" }}>
                      {meta.format(baseVal)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "155px 1fr 78px",
                      alignItems: "center",
                      gap: "0.6rem",
                      fontSize: "0.78rem",
                    }}
                  >
                    <span style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
                      UI SDK Agent Bridge
                    </span>
                    <div
                      style={{
                        height: "14px",
                        background: "#dbeafe",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${scaleWidth(bridgeVal)}%`,
                          height: "100%",
                          background: "var(--accent)",
                          borderRadius: "3px",
                          transition: "width 200ms ease",
                        }}
                      />
                    </div>
                    <span
                      className="mono"
                      style={{
                        textAlign: "right",
                        color: "var(--accent-ink)",
                        fontWeight: 600,
                      }}
                    >
                      {meta.format(bridgeVal)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <figcaption className="figure-caption">
        Modeled after SID-2 Technical Report interactive charts. Controls use{" "}
        <code>@ui-sdk/react/segmented-control</code> and <code>@ui-sdk/react/switch</code>{" "}
        and are directly inspectable and actionable via the Agent Console.
      </figcaption>
    </figure>
  )
}
