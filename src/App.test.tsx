import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"
import { App } from "./App"
import { computeDxBallPan } from "./components/DxBallFigure"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { getBlogAgent } from "./lib/blog-agent"
import { clearRecentErrors, getRecentErrors } from "./lib/error-reporter"

beforeEach(() => {
  window.history.replaceState(null, "", "/")
  clearRecentErrors()
})

describe("DX-Ball pan oracle", () => {
  it("matches verified x86 DirectSound pan formula", () => {
    expect(computeDxBallPan(0)).toBe(-500)
    expect(computeDxBallPan(320)).toBe(0)
    expect(computeDxBallPan(640)).toBe(500)
  })
})

describe("REA Research Blog interactive UX", () => {
  it("cycles the header theme through system, light, dark, and back to system", async () => {
    const user = userEvent.setup()
    const { dataset } = document.documentElement
    // Stub a clean Storage implementation so Node 26's unconfigured --localstorage-file does not interfere.
    const store = new Map<string, string>()
    const storage: Storage = {
      get length() {
        return store.size
      },
      clear() {
        store.clear()
      },
      getItem(key) {
        return store.get(key) ?? null
      },
      key(index) {
        return [...store.keys()].at(index) ?? null
      },
      removeItem(key) {
        store.delete(key)
      },
      setItem(key, value) {
        store.set(key, String(value))
      },
    }
    const storageKey = "rea-theme"
    vi.stubGlobal("localStorage", storage)
    storage.removeItem(storageKey)
    delete dataset.theme
    try {
      render(<App />)
      const header = screen.getByRole("banner")
      expect(dataset.theme).toBeUndefined()
      expect(storage.getItem(storageKey)).toBeNull()

      for (const theme of ["light", "dark", undefined]) {
        await user.click(within(header).getByRole("button", { name: /theme/i }))
        expect(dataset.theme).toBe(theme)
        expect(storage.getItem(storageKey)).toBe(theme ?? null)
      }
    } finally {
      storage.removeItem(storageKey)
      delete dataset.theme
      vi.unstubAllGlobals()
    }
  })

  it("steps through DX-Ball reconstruction via EvidenceStepper and buttons", async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      await screen.findByRole("heading", {
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

  it("supports keyboard navigation on EvidenceStepper", async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole("heading", {
      name: /DX-Ball Sound-Panning: x86 Assembly to Verified C/i,
    })

    const firstStep = document.querySelector<HTMLButtonElement>(
      '[data-slot="evidence-stepper-step"][aria-current="step"]'
    )
    expect(firstStep).not.toBeNull()
    firstStep?.focus()
    await user.keyboard("{ArrowRight}{Enter}")

    const activeAfterKey = document.querySelector(
      '[data-slot="evidence-stepper-step"][aria-current="step"]'
    )
    expect(activeAfterKey?.textContent).toContain("02")
  })

  it("switches benchmark metrics and filters REA targets", async () => {
    const user = userEvent.setup()
    render(<App />)

    const toolCallsOption = await screen.findByRole("radio", {
      name: /Tool calls/i,
    })
    await user.click(toolCallsOption)
    expect(toolCallsOption.getAttribute("aria-checked")).toBe("true")

    const filterInput = await screen.findByLabelText(
      /Filter REA targets by name, tool, or prerequisite/i
    )
    await user.type(filterInput, "Electron")
    expect(screen.getByText(/Showing 1 of/i)).toBeTruthy()
  })

  it("navigates via History API URLs and supports browser popstate back/forward", async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(window.location.pathname).toBe("/")

    await user.click(screen.getByRole("link", { name: /^All Research$/i }))
    expect(window.location.pathname).toBe("/research")
    expect(
      await screen.findByRole("heading", {
        name: /Discoveries from Evidence-First Engineering/i,
      })
    ).toBeTruthy()
    expect(document.title).toContain("All Research")

    await user.click(screen.getByRole("link", { name: /^Design System$/i }))
    expect(window.location.pathname).toBe("/design-system")
    expect(
      await screen.findByRole("heading", { name: /Component Gallery/i })
    ).toBeTruthy()

    act(() => {
      window.history.replaceState(null, "", "/posts/agent-environments")
      window.dispatchEvent(new PopStateEvent("popstate"))
    })
    expect(
      await screen.findByRole("heading", { name: /Offline RL Pipeline/i })
    ).toBeTruthy()
  })

  it("exposes mounted UI SDK components to createAgent() and executes actions", async () => {
    render(<App />)

    await screen.findByRole("heading", {
      name: /DX-Ball Sound-Panning: x86 Assembly to Verified C/i,
    })

    const agent = getBlogAgent()
    await waitFor(() => {
      expect(agent.snapshot().length).toBeGreaterThanOrEqual(4)
    })

    const stepper = agent
      .snapshot()
      .find((c) => /DX-Ball reconstruction/i.test(String(c.label ?? "")))
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
    await user.click(screen.getByRole("link", { name: /^All Research$/i }))
    const heading = await screen.findByRole("heading", {
      name: /AgentEnv: Turning Recorded Captures/i,
    })
    const card = heading.closest("article")
    if (!card) {
      throw new Error("Expected AgentEnv article card")
    }
    await user.click(
      within(card).getByRole("link", {
        name: /Open interactive post/i,
      })
    )
    expect(window.location.pathname).toBe("/posts/agent-environments")
    expect(
      await screen.findByRole("heading", { name: /Offline RL Pipeline/i })
    ).toBeTruthy()
    await user.click(screen.getByRole("radio", { name: /2\. Compile/i }))
    expect(screen.getByText(/routes_synthesized/i)).toBeTruthy()
  })

  it("renders paragraph-anchored Tufte sidenotes, reading progress bar, and opens inline note popover", async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.getByRole("progressbar", { name: /Reading progress/i })
    ).toBeTruthy()
    const marginNote = screen.getByRole("note", {
      name: /Margin note 3: Showcase scope/i,
    })
    expect(
      within(marginNote).getByText(/3,205 oracle comparisons/i)
    ).toBeTruthy()

    const noteBtn = screen.getByRole("button", {
      name: /Note 3: Showcase scope/i,
    })
    await user.click(noteBtn)
    expect(screen.getByText(/Note \[3\] · Showcase scope/i)).toBeTruthy()
  })

  it("opens the Design System gallery with interactive UI SDK specimens", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("link", { name: /^Design System$/i }))
    expect(
      await screen.findByRole("heading", { name: /Component Gallery/i })
    ).toBeTruthy()
    expect(
      await screen.findByRole("heading", { name: /Waterfall & Collapsible/i })
    ).toBeTruthy()
  })

  it("isolates figure crashes in ErrorBoundary, records error, and recovers on retry", async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    let shouldThrow = true

    function FlakyFigure() {
      if (shouldThrow) {
        throw new Error("Simulated figure crash")
      }
      return <div>Recovered figure content</div>
    }

    render(
      <ErrorBoundary scope="figure" label="Test Figure">
        <FlakyFigure />
      </ErrorBoundary>
    )

    expect(screen.getByRole("alert")).toBeTruthy()
    expect(screen.getByText(/Simulated figure crash/i)).toBeTruthy()
    expect(getRecentErrors().length).toBe(1)

    shouldThrow = false
    await user.click(screen.getByRole("button", { name: /Retry figure/i }))
    expect(screen.getByText("Recovered figure content")).toBeTruthy()

    consoleSpy.mockRestore()
  })

  it("renders a 404 view for unknown routes and navigates back to All Research", async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, "", "/does-not-exist")
    render(<App />)

    expect(
      screen.getByRole("heading", { name: /404: Page not found/i })
    ).toBeTruthy()
    expect(screen.getByText("/does-not-exist")).toBeTruthy()

    const allResearchLink = screen
      .getAllByRole("link", { name: /^All Research$/i })
      .at(-1)
    expect(allResearchLink).toBeTruthy()
    if (allResearchLink) {
      await user.click(allResearchLink)
    }
    expect(window.location.pathname).toBe("/research")
    expect(
      screen.getByRole("heading", {
        name: /Discoveries from Evidence-First Engineering/i,
      })
    ).toBeTruthy()
  })

  it("passes axe-core accessibility checks with zero critical or serious violations", async () => {
    const { container } = render(<App />)
    await screen.findByRole("heading", {
      name: /DX-Ball Sound-Panning: x86 Assembly to Verified C/i,
    })

    const results = await axe.run(container, {
      rules: {
        // jsdom does not compute layout/color contrast
        "color-contrast": { enabled: false },
      },
    })
    const severe = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    )
    expect(severe).toEqual([])
  })
})
