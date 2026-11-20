import { useState } from "react"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs"
import { NOTION_HOPS } from "../data/blog-data"

export function NotionIpcFigure() {
  const [hopId, setHopId] = useState<string>(NOTION_HOPS[0].id)

  return (
    <figure className="figure-card" aria-labelledby="fig-notion-title">
      <div className="figure-header">
        <div>
          <div className="figure-label">Figure 3 · Electron Trust Boundary</div>
          <h3 id="fig-notion-title" className="figure-title">
            Notion Desktop 7.6.1 Clipboard Write IPC Chain
          </h3>
        </div>
        <span className="pill-badge pill-badge-neutral">
          Channel: notion:clipboard:write
        </span>
      </div>

      <div className="figure-body">
        <Tabs
          value={hopId}
          onValueChange={(next) => {
            if (next) {setHopId(next)}
          }}
        >
          <TabsList aria-label="Notion Desktop clipboard IPC hops">
            {NOTION_HOPS.map((hop) => (
              <TabsTab key={hop.id} value={hop.id}>
                {hop.stage}
              </TabsTab>
            ))}
          </TabsList>

          {NOTION_HOPS.map((hop) => (
            <TabsPanel key={hop.id} value={hop.id}>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                      {hop.file}
                    </div>
                    <div className="mono" style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                      {hop.location}
                    </div>
                  </div>
                  <span className="pill-badge pill-badge-success">{hop.process}</span>
                </div>

                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-secondary)" }}>
                  {hop.summary}
                </p>

                <div className="code-split">
                  <div className="code-pane">
                    <div className="code-pane-head">
                      <span>{hop.file}</span>
                      <span>Source</span>
                    </div>
                    <pre className="code-lines">
                      {hop.code.split("\n").map((line: string, i: number) => (
                        <div key={i} className="code-line">
                          <span className="code-line-no">{i + 1}</span>
                          <code>{line}</code>
                        </div>
                      ))}
                    </pre>
                  </div>

                  <div className="code-pane">
                    <div className="code-pane-head">
                      <span>REA Static Observation</span>
                      <span>{hop.process}</span>
                    </div>
                    <pre className="code-lines">
                      {hop.reaOutput.split("\n").map((line: string, i: number) => (
                        <div key={i} className="code-line">
                          <span className="code-line-no">{i + 1}</span>
                          <code>{line}</code>
                        </div>
                      ))}
                    </pre>
                  </div>
                </div>
              </div>
            </TabsPanel>
          ))}
        </Tabs>
      </div>

      <figcaption className="figure-caption">
        Uses <code>@ui-sdk/react/tabs</code> to walk through each Electron boundary from
        renderer preload to the sender-checked <code>ipcMain.handle</code> sink.
      </figcaption>
    </figure>
  )
}
