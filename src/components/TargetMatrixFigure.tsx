import { useMemo, useState } from "react"
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import {
  Waterfall,
  WaterfallBar,
  WaterfallRow,
  WaterfallRowHeader,
} from "@ui-sdk/react/waterfall"
import { INVESTIGATION_META, INVESTIGATION_SPANS, REA_TARGETS } from '../data/blog-data';
import type { TargetRow } from '../data/blog-data';

type EngineFilter = "all" | TargetRow["engine"]

export function TargetMatrixFigure() {
  const [engine, setEngine] = useState<EngineFilter>("all")
  const [query, setQuery] = useState("")
  const [selectedSpan, setSelectedSpan] = useState<string>(INVESTIGATION_SPANS[0].value)

  const filteredTargets = useMemo(() => {
    const q = query.trim().toLowerCase()
    return REA_TARGETS.filter((t) => {
      if (engine !== "all" && t.engine !== engine) {return false}
      if (!q) {return true}
      return (
        t.target.toLowerCase().includes(q) ||
        t.tool.toLowerCase().includes(q) ||
        t.prerequisite.toLowerCase().includes(q) ||
        t.returns.toLowerCase().includes(q)
      )
    })
  }, [engine, query])

  const spanMeta = Object.entries(INVESTIGATION_META).find(
    ([key]) => key === selectedSpan
  )?.[1]

  return (
    <figure className="figure-card" aria-labelledby="fig-matrix-title">
      <div className="figure-header">
        <div>
          <div className="figure-label">Figure 4 · Capability Matrix &amp; Trace</div>
          <h3 id="fig-matrix-title" className="figure-title">
            REA Target Surface &amp; Investigation Span Waterfall
          </h3>
        </div>

        <SegmentedControl
          aria-label="Filter REA targets by engine requirement"
          value={engine}
          onValueChange={(v) => {
            if (v !== null) {
              setEngine(v)
            }
          }}
        >
          <SegmentedControlIndicator />
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="Built-in static">Built-in static</SegmentedControlItem>
          <SegmentedControlItem value="Bring-your-own engine">BYO engine</SegmentedControlItem>
          <SegmentedControlItem value="Live runtime">Live runtime</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="figure-body">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <InputGroup>
            <Input
              aria-label="Filter REA targets by name, tool, or prerequisite"
              placeholder="Filter targets (e.g. Electron, Ghidra, SQLite)..."
              value={query}
              onValueChange={(v) => setQuery(v)}
            />
            {query && <InputClear aria-label="Clear target filter">×</InputClear>}
          </InputGroup>

          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
            Showing {filteredTargets.length} of {REA_TARGETS.length} target families
          </span>
        </div>

        <div
          role="region"
          aria-label="REA target capability matrix"
          tabIndex={0}
          style={{ overflowX: "auto", marginBottom: "1.5rem" }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Target family</th>
                <th>Primary REA tools</th>
                <th>Prerequisite</th>
                <th>Returns</th>
              </tr>
            </thead>
            <tbody>
              {filteredTargets.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong style={{ color: "var(--ink)" }}>{row.target}</strong>
                  </td>
                  <td className="mono" style={{ fontSize: "0.78rem" }}>
                    {row.tool}
                  </td>
                  <td>{row.prerequisite}</td>
                  <td style={{ color: "var(--ink-secondary)" }}>{row.returns}</td>
                </tr>
              ))}
              {filteredTargets.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-muted)" }}>
                    No target families match &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div id="investigation-waterfall" style={{ marginBottom: "0.5rem" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)" }}>
            Illustrative Investigation Trace (Synthetic 940 ms DX-Ball Timeline)
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--ink-muted)" }}>
            Five spans with illustrative timings, not measured host latency. Select a span or use
            the Up and Down arrow keys to read its phase notes.
          </div>
        </div>

        <div className="waterfall-grid" tabIndex={0} role="region" aria-label="Investigation trace timeline">
          <Waterfall
            aria-label="Illustrative DX-Ball investigation trace waterfall"
            items={INVESTIGATION_SPANS}
            defaultExpanded={["session"]}
            value={selectedSpan}
            onValueChange={(next) => {
              if (next) {setSelectedSpan(next)}
            }}
          >
            {INVESTIGATION_SPANS.flatMap((span) => [span, ...(span.children ?? [])]).map((span) => (
              <WaterfallRow key={span.value} value={span.value}>
                <WaterfallRowHeader>{span.label}</WaterfallRowHeader>
                <div className="waterfall-track">
                  <WaterfallBar />
                </div>
              </WaterfallRow>
            ))}
          </Waterfall>
        </div>

        {spanMeta && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem 0.9rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-subtle)",
              fontSize: "0.84rem",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "0.5rem",
            }}
          >
            <div>
              <strong style={{ color: "var(--ink)" }}>{spanMeta.phase}</strong>:{" "}
              <span style={{ color: "var(--ink-secondary)" }}>{spanMeta.note}</span>
            </div>
            <span className="pill-badge">{selectedSpan}</span>
          </div>
        )}
      </div>

      <figcaption className="figure-caption">
        The synthetic millisecond durations demonstrate <code>@ui-sdk/react/waterfall</code>.
        They are not measured host benchmarks.
      </figcaption>
    </figure>
  )
}
