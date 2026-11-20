import { useMemo, useState } from "react"
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
} from "@ui-sdk/react/slider"
import {
  EvidenceStepper,
  EvidenceStepperList,
  EvidenceStepperStep,
} from "../primitives/evidence-stepper-react"
import { DXBALL_ASM, DXBALL_C, DXBALL_STEPS } from "../data/blog-data"

/**
 * Simulates the reconstructed DX-Ball DirectSound pan formula in JavaScript:
 * pan = trunc((x * 1.5625 - 500.0) * scale)
 */
export function computeDxBallPan(x: number, scale = 1): number {
  const pan = (x * 1.5625 - 500.0) * scale
  return Math.trunc(pan)
}

export function DxBallFigure() {
  const [stepId, setStepId] = useState<string>(DXBALL_STEPS[0].id)
  const [xPos, setXPos] = useState<number>(320)

  const currentStep = useMemo(
    () => DXBALL_STEPS.find((s) => s.id === stepId) ?? DXBALL_STEPS[0],
    [stepId]
  )
  const currentIndex = DXBALL_STEPS.findIndex((s) => s.id === currentStep.id)
  const panValue = computeDxBallPan(xPos, 1)

  const panDirection =
    panValue === 0
      ? "Center"
      : panValue < 0
        ? `Left (${panValue} dB-hundredths)`
        : `Right (+${panValue} dB-hundredths)`

  return (
    <figure className="figure-card" aria-labelledby="fig-dxball-title">
      <div className="figure-header">
        <div>
          <div className="figure-label">Figure 1 · Interactive Reconstruction</div>
          <h3 id="fig-dxball-title" className="figure-title">
            DX-Ball Sound-Panning: x86 Assembly to Verified C
          </h3>
        </div>
        <span className="pill-badge pill-badge-success">
          Showcase results: 3,205 / 3,205 oracle cases · 63 matching bytes
        </span>
      </div>

      <div className="figure-body">
        <EvidenceStepper
          aria-label="DX-Ball reconstruction evidence steps"
          steps={DXBALL_STEPS.map((s) => s.id)}
          value={stepId}
          onValueChange={setStepId}
        >
          <EvidenceStepperList>
            {DXBALL_STEPS.map((step) => (
              <EvidenceStepperStep key={step.id} value={step.id}>
                <span className="step-num">{step.number}</span>
                <span>{step.title}</span>
              </EvidenceStepperStep>
            ))}
          </EvidenceStepperList>
        </EvidenceStepper>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            padding: "0.75rem 0.9rem",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
            marginBottom: "0.9rem",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--ink)" }}>
              {currentStep.number}. {currentStep.title}
            </div>
            <div style={{ fontSize: "0.84rem", color: "var(--ink-secondary)", marginTop: "0.2rem" }}>
              {currentStep.explanation}
            </div>
            <div className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.3rem" }}>
              {currentStep.reaTool}: {currentStep.reaQuery}
            </div>
          </div>
          <span className="pill-badge">{currentStep.evidenceId}</span>
        </div>

        <div className="code-split">
          <div className="code-pane">
            <div className="code-pane-head">
              <span>x86 Disassembly Excerpt (routine at 0x00406400)</span>
              <span>REA Ghidra</span>
            </div>
            <pre className="code-lines" tabIndex={0} role="region" aria-label="DX-Ball x86 disassembly excerpt">
              {DXBALL_ASM.map((line, i) => {
                const active = currentStep.asmLines.includes(i)
                return (
                  <div
                    key={i}
                    className={`code-line ${active ? "code-line-active" : ""}`}
                  >
                    <span className="code-line-no">{i + 1}</span>
                    <code>{line}</code>
                  </div>
                )
              })}
            </pre>
          </div>

          <div className="code-pane">
            <div className="code-pane-head">
              <span>Reconstructed C (dxball_screen_pan)</span>
              <span>MSVC</span>
            </div>
            <pre className="code-lines" tabIndex={0} role="region" aria-label="DX-Ball reconstructed C code">
              {DXBALL_C.map((line, i) => {
                const active = currentStep.cLines.includes(i)
                return (
                  <div
                    key={i}
                    className={`code-line ${active ? "code-line-active" : ""}`}
                  >
                    <span className="code-line-no">{i + 1}</span>
                    <code>{line}</code>
                  </div>
                )
              })}
            </pre>
          </div>
        </div>

        <div
          id="pan-simulator"
          style={{
            marginTop: "1rem",
            padding: "0.9rem 1rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--bg-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.4rem",
              marginBottom: "0.5rem",
              fontSize: "0.84rem",
            }}
          >
            <strong style={{ color: "var(--ink)" }}>
              Reconstructed C Formula Simulator
            </strong>
            <span className="mono" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
              x = {xPos}px → pan = {panValue} ({panDirection})
            </span>
          </div>

          <p id="pan-simulator-description" style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", color: "var(--ink-muted)" }}>
            Move the ball horizontally to evaluate the formula in JavaScript at a pan scale of 1.0.
            The simulator does not execute the original x86 binary.
          </p>

          <Slider
            min={0}
            max={640}
            step={1}
            value={xPos}
            onValueChange={(next: number | Array<number>) => {
              const value = Array.isArray(next) ? next[0] : next
              if (typeof value === "number") {
                setXPos(value)
              }
            }}
            aria-label="DX-Ball horizontal X coordinate in pixels"
          >
            <SliderControl>
              <SliderTrack>
                <SliderIndicator />
                <SliderThumb aria-label="Ball X coordinate" aria-describedby="pan-simulator-description" />
              </SliderTrack>
            </SliderControl>
          </Slider>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.74rem",
              color: "var(--ink-muted)",
              marginTop: "0.25rem",
            }}
          >
            <span>0 px (Left wall: -500)</span>
            <span>320 px (Center: 0)</span>
            <span>640 px (Right wall: +500)</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "0.9rem",
          }}
        >
          <button
            type="button"
            className="btn btn-sm"
            disabled={currentIndex <= 0}
            onClick={() => setStepId(DXBALL_STEPS[Math.max(0, currentIndex - 1)].id)}
          >
            Previous step
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={currentIndex >= DXBALL_STEPS.length - 1}
            onClick={() =>
              setStepId(
                DXBALL_STEPS[Math.min(DXBALL_STEPS.length - 1, currentIndex + 1)].id
              )
            }
          >
            Next step
          </button>
        </div>
      </div>

      <figcaption className="figure-caption">
        The <code>ev:dxball:*</code> tags are figure step anchors for the published REA 4.1.0
        DX-Ball 1.07 showcase checkpoint (7 October 2026), not REA Evidence IDs. Use the
        Left and Right arrow keys to move between steps.
      </figcaption>
    </figure>
  )
}
