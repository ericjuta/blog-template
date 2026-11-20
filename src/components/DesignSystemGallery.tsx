import { useState } from "react"
import { Button } from "@ui-sdk/react/button"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@ui-sdk/react/collapsible"
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input"
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@ui-sdk/react/popover"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
} from "@ui-sdk/react/slider"
import { Switch, SwitchThumb } from "@ui-sdk/react/switch"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs"
import {
  Waterfall,
  WaterfallBar,
  WaterfallRow,
  WaterfallRowHeader,
} from "@ui-sdk/react/waterfall"
import {
  EvidenceStepper,
  EvidenceStepperList,
  EvidenceStepperStep,
} from "../primitives/evidence-stepper-react"

const SAMPLE_SPANS = [
  {
    value: "root",
    label: "rea: sample session",
    start: 0,
    duration: 500,
    children: [
      { value: "step-a", label: "open_binary(sample)", start: 0, duration: 140 },
      { value: "step-b", label: "analyze_function(0x401000)", start: 150, duration: 210 },
      { value: "step-c", label: "ui-sdk: agent.act(verify)", start: 370, duration: 130 },
    ],
  },
]

const SAMPLE_STEPS = [
  { id: "s1", num: "01", title: "Capture" },
  { id: "s2", num: "02", title: "Decompile" },
  { id: "s3", num: "03", title: "Verify" },
  { id: "s4", num: "04", title: "Publish" },
]

export function DesignSystemGallery({ onOpenConsole }: { onOpenConsole: () => void }) {
  const [seg, setSeg] = useState("tokens")
  const [swChecked, setSwChecked] = useState(true)
  const [swUnchecked, setSwUnchecked] = useState(false)
  const [sliderVal, setSliderVal] = useState(320)
  const [query, setQuery] = useState("electron")
  const [tab, setTab] = useState("overview")
  const [stepId, setStepId] = useState("s2")
  const [wfVal, setWfVal] = useState("step-b")

  return (
    <main className="index-shell">
      <div className="index-header" style={{ marginBottom: "2rem" }}>
        <div>
          <div className="figure-label" style={{ marginBottom: "0.35rem" }}>
            Design System · @ui-sdk/react 0.1.0-beta.13
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2.4rem", margin: 0 }}>
            Component Gallery
          </h1>
          <p style={{ color: "var(--ink-secondary)", marginTop: "0.5rem", maxWidth: "60ch" }}>
            Isolated interactive specimens for every Vercel UI SDK primitive and custom behavior
            used across REA Research. Every control is keyboard-navigable and registered with the
            live <code>Agent Console</code>.
          </p>
        </div>
        <Button className="btn btn-primary" onClick={onOpenConsole}>
          Inspect in Agent Console
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* 1. Buttons & Badges */}
        <section className="figure-card" style={{ margin: 0 }}>
          <div className="figure-header">
            <div>
              <div className="figure-label">01 · Actions &amp; Status</div>
              <h2 className="figure-title">Buttons &amp; Badges</h2>
            </div>
          </div>
          <div className="figure-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <Button className="btn btn-primary">Primary</Button>
              <Button className="btn">Default</Button>
              <Button className="btn btn-ghost">Ghost</Button>
              <Button className="btn btn-sm">Small</Button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <span className="pill-badge">Accent Badge</span>
              <span className="pill-badge pill-badge-neutral">Neutral</span>
              <span className="pill-badge pill-badge-success">Verified</span>
            </div>
          </div>
        </section>

        {/* 2. Segmented Control & Switch */}
        <section className="figure-card" style={{ margin: 0 }}>
          <div className="figure-header">
            <div>
              <div className="figure-label">02 · Selection &amp; Toggles</div>
              <h2 className="figure-title">Segmented Control &amp; Switch</h2>
            </div>
          </div>
          <div className="figure-body" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <SegmentedControl
              aria-label="Gallery metric selector"
              value={seg}
              onValueChange={(v) => v && setSeg(v)}
            >
              <SegmentedControlIndicator />
              <SegmentedControlItem value="tokens">Tokens</SegmentedControlItem>
              <SegmentedControlItem value="calls">Tool calls</SegmentedControlItem>
              <SegmentedControlItem value="time">Wall time</SegmentedControlItem>
            </SegmentedControl>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem" }}>
              <label className="switch-label">
                <Switch
                  checked={swChecked}
                  onCheckedChange={setSwChecked}
                  aria-label="Checked switch demo"
                >
                  <SwitchThumb />
                </Switch>
                <span>Checked ({swChecked ? "on" : "off"})</span>
              </label>
              <label className="switch-label">
                <Switch
                  checked={swUnchecked}
                  onCheckedChange={setSwUnchecked}
                  aria-label="Unchecked switch demo"
                >
                  <SwitchThumb />
                </Switch>
                <span>Unchecked ({swUnchecked ? "on" : "off"})</span>
              </label>
            </div>
          </div>
        </section>

        {/* 3. Slider & InputGroup */}
        <section className="figure-card" style={{ margin: 0 }}>
          <div className="figure-header">
            <div>
              <div className="figure-label">03 · Range &amp; Text Input</div>
              <h2 className="figure-title">Slider &amp; InputGroup</h2>
            </div>
          </div>
          <div className="figure-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.35rem" }}>
                <span>Pan X coordinate</span>
                <span className="mono">{sliderVal} px</span>
              </div>
              <Slider
                min={0}
                max={640}
                value={sliderVal}
                onValueChange={(v) => setSliderVal(typeof v === "number" ? v : v[0])}
              >
                <SliderControl>
                  <SliderTrack>
                    <SliderIndicator />
                    <SliderThumb aria-label="Gallery pan X slider" />
                  </SliderTrack>
                </SliderControl>
              </Slider>
            </div>
            <InputGroup>
              <Input
                aria-label="Gallery search input"
                placeholder="Filter target families..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <InputClear aria-label="Clear search" onClick={() => setQuery("")}>
                  ×
                </InputClear>
              )}
            </InputGroup>
          </div>
        </section>

        {/* 4. Tabs & Popover */}
        <section className="figure-card" style={{ margin: 0 }}>
          <div className="figure-header">
            <div>
              <div className="figure-label">04 · Navigation &amp; Overlays</div>
              <h2 className="figure-title">Tabs &amp; Citation Popover</h2>
            </div>
          </div>
          <div className="figure-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Tabs value={tab} onValueChange={(v) => v && setTab(v)}>
              <TabsList aria-label="Gallery sample tabs">
                <TabsTab value="overview">1. Overview</TabsTab>
                <TabsTab value="preload">2. Preload</TabsTab>
                <TabsTab value="ipc">3. IPC Sink</TabsTab>
              </TabsList>
              <TabsPanel value="overview">
                <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
                  Single-row horizontally scrollable tab strip with active accent underline.
                </p>
              </TabsPanel>
              <TabsPanel value="preload">
                <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
                  Preload bridge exposes narrow typed wrappers over <code>ipcRenderer.invoke</code>.
                </p>
              </TabsPanel>
              <TabsPanel value="ipc">
                <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
                  Main-process handler validates sender origin before mutating clipboard state.
                </p>
              </TabsPanel>
            </Tabs>

            <div>
              <Popover>
                <PopoverTrigger className="btn btn-sm">Open Citation Popover [1]</PopoverTrigger>
                <PopoverContent className="citation-popover">
                  <div className="citation-popover-head">
                    <span className="citation-popover-title">Note 1 · Provenance</span>
                    <PopoverClose className="citation-popover-close" aria-label="Close popover">
                      ×
                    </PopoverClose>
                  </div>
                  <p className="citation-popover-body">
                    Opaque white surface with crisp border and elevation shadow so inline notes
                    never bleed over underlying copy.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </section>

        {/* 5. Custom EvidenceStepper */}
        <section className="figure-card" style={{ margin: 0, gridColumn: "1 / -1" }}>
          <div className="figure-header">
            <div>
              <div className="figure-label">05 · Custom UI SDK Primitive</div>
              <h2 className="figure-title">EvidenceStepper (Roving Focus + Agent Actions)</h2>
            </div>
            <span className="pill-badge">step: {stepId}</span>
          </div>
          <div className="figure-body">
            <EvidenceStepper
              value={stepId}
              onValueChange={setStepId}
              steps={SAMPLE_STEPS.map((s) => s.id)}
              aria-label="Gallery evidence stepper"
            >
              <EvidenceStepperList style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                {SAMPLE_STEPS.map((s) => (
                  <EvidenceStepperStep key={s.id} value={s.id}>
                    <span className="step-num">{s.num}</span>
                    <span className="step-title">{s.title}</span>
                  </EvidenceStepperStep>
                ))}
              </EvidenceStepperList>
            </EvidenceStepper>
          </div>
        </section>

        {/* 6. Waterfall & Collapsible */}
        <section className="figure-card" style={{ margin: 0, gridColumn: "1 / -1" }}>
          <div className="figure-header">
            <div>
              <div className="figure-label">06 · Timeline &amp; Disclosure</div>
              <h2 className="figure-title">Waterfall &amp; Collapsible</h2>
            </div>
            <span className="pill-badge pill-badge-neutral">selected: {wfVal}</span>
          </div>
          <div className="figure-body">
            <div className="waterfall-grid">
              <Waterfall
                aria-label="Gallery sample waterfall"
                items={SAMPLE_SPANS}
                defaultExpanded={["root"]}
                value={wfVal}
                onValueChange={(v) => v && setWfVal(v)}
              >
                {SAMPLE_SPANS.flatMap((s) => [s, ...(s.children ?? [])]).map((span) => (
                  <WaterfallRow key={span.value} value={span.value}>
                    <WaterfallRowHeader>{span.label}</WaterfallRowHeader>
                    <div className="waterfall-track">
                      <WaterfallBar />
                    </div>
                  </WaterfallRow>
                ))}
              </Waterfall>
            </div>

            <Collapsible className="collapsible-box" style={{ marginBottom: 0 }}>
              <CollapsibleTrigger className="collapsible-trigger">
                <span>Disclosure panel (UI SDK native rotating chevron)</span>
              </CollapsibleTrigger>
              <CollapsiblePanel>
                <div className="collapsible-panel-inner">
                  UI SDK automatically injects and rotates the chevron indicator on{" "}
                  <code>{`[data-slot="collapsible-trigger"]`}</code> without duplicate text labels.
                </div>
              </CollapsiblePanel>
            </Collapsible>
          </div>
        </section>
      </div>
    </main>
  )
}
