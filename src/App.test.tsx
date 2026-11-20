import { describe, expect, it } from "vitest"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { App } from "./App"
import { computeDxBallPan } from "./components/DxBallFigure"
import { getBlogAgent } from "./lib/blog-agent"

describe("DX-Ball pan oracle", () => {
  it("matches verified x86 DirectSound pan formula", () => {
    expect(computeDxBallPan(0)).toBe(-500)
    expect(computeDxBallPan(320)).toBe(0)
    expect(computeDxBallPan(640)).toBe(500)
  })
})

describe("REA Research Blog interactive UX", () => {
  it("steps through DX-Ball reconstruction via EvidenceStepper and buttons", async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.getByRole("heading", {
        name: /DX-Ball Sound-Panning: x86 Assembly to Verified C/i,
      })
    ).toBeTruthy()

    const nextBtn = screen.getByRole("button", { name: /Next step/i })
    await user.click(nextBtn)

    const currentStep = document.querySelector(
      '[data-slot="evidence-stepper-step"][aria-current="step"]'
    )
    expect(currentStep?.textContent).toContain("02")
  })

  it("switches benchmark metrics and filters REA targets", async () => {
    const user = userEvent.setup()
    render(<App />)

    const toolCallsOption = screen.getByRole("radio", { name: /Tool calls/i })
    await user.click(toolCallsOption)
    expect(toolCallsOption.getAttribute("aria-checked")).toBe("true")

    const filterInput = screen.getByLabelText(
      /Filter REA targets by name, tool, or prerequisite/i
    )
    await user.type(filterInput, "Electron")
    expect(screen.getByText(/Showing 1 of/i)).toBeTruthy()
  })

  it("navigates between Technical Report and All Research index", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /^All Research$/i }))
    expect(
      screen.getByRole("heading", {
        name: /Discoveries from Evidence-First Engineering/i,
      })
    ).toBeTruthy()
  })

  it("exposes mounted UI SDK components to createAgent() and executes actions", async () => {
    render(<App />)
    const agent = getBlogAgent()
    const snapshot = agent.snapshot()
    expect(snapshot.length).toBeGreaterThanOrEqual(4)

    const stepper = snapshot.find((c) =>
      /DX-Ball reconstruction/i.test(String(c.label ?? ""))
    )
    expect(stepper).toBeDefined()
    expect(stepper?.actions).toContain("next")

    let result: Awaited<ReturnType<typeof agent.act>> | undefined
    await act(async () => {
      result = await agent.act({
        steps: [{ ref: stepper!.ref, action: "next" }],
      })
    })
    expect(result?.ok).toBe(true)

    await waitFor(() => {
      const currentStep = document.querySelector(
        '[data-slot="evidence-stepper-step"][aria-current="step"]'
      )
      expect(currentStep?.textContent).toContain("02")
    })
  })

  it("opens the Agent Console drawer and displays discovered components", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /Agent Console/i }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toBeTruthy()
    expect(
      within(dialog).getByText(/Discovered SDK Components/i)
    ).toBeTruthy()
  })

  it("renders dedicated interactive body for AgentEnv archive post", async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole("button", { name: /^All Research$/i }))
    const heading = screen.getByRole("heading", {
      name: /AgentEnv: Turning Recorded Captures/i,
    })
    const card = heading.closest("article")
    expect(card).toBeTruthy()
    await user.click(
      within(card as HTMLElement).getByRole("button", {
        name: /Open interactive post/i,
      })
    )
    expect(screen.getByRole("heading", { name: /Offline RL Pipeline/i })).toBeTruthy()
    await user.click(screen.getByRole("radio", { name: /2\. Compile/i }))
    expect(screen.getByText(/routes_synthesized/i)).toBeTruthy()
  })

  it("renders paragraph-anchored Tufte sidenotes, reading progress bar, and opens inline note popover", async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole("progressbar", { name: /Reading progress/i })).toBeTruthy()
    const marginNote = screen.getByRole("note", { name: /Margin note 3: Showcase scope/i })
    expect(within(marginNote).getByText(/3,205 oracle comparisons/i)).toBeTruthy()

    const noteBtn = screen.getByRole("button", { name: /Note 3: Showcase scope/i })
    await user.click(noteBtn)
    expect(screen.getByText(/Note \[3\] · Showcase scope/i)).toBeTruthy()
  })
})
