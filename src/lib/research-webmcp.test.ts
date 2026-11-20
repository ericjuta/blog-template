import { afterEach, describe, expect, it, vi } from "vitest"
import { registerResearchTool } from "./research-webmcp"

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext")
  Reflect.deleteProperty(navigator, "modelContext")
})

type RegisterTool = NonNullable<Document["modelContext"]>["registerTool"]

describe("research WebMCP tool", () => {
  it("prefers document.modelContext and returns matching published articles", async () => {
    const registerTool = vi.fn<RegisterTool>()
    const fallback = vi.fn<RegisterTool>()
    Object.defineProperty(document, "modelContext", { configurable: true, value: { registerTool } })
    Object.defineProperty(navigator, "modelContext", { configurable: true, value: { registerTool: fallback } })

    const dispose = registerResearchTool()
    expect(registerTool).toHaveBeenCalledOnce()
    expect(fallback).not.toHaveBeenCalled()
    const [tool, { signal }] = registerTool.mock.calls[0]
    expect(tool.name).toBe("find_research_posts")
    expect(tool.annotations.readOnlyHint).toBe(true)
    expect(signal.aborted).toBe(false)
    expect((await tool.execute({})).posts).toHaveLength(4)
    expect((await tool.execute({ query: "AgentEnv offline" })).posts).toEqual([
      expect.objectContaining({ title: expect.stringContaining("AgentEnv"), markdownUrl: expect.stringMatching(/\/agent-environments\.md$/) }),
    ])
    expect((await tool.execute({ query: "not-a-research-topic" })).posts).toEqual([])
    dispose?.()
    expect(signal.aborted).toBe(true)
  })

  it("accepts a legacy navigator implementation and tolerates unsupported browsers", () => {
    expect(() => registerResearchTool()?.()).not.toThrow()
    const registerTool = vi.fn<RegisterTool>()
    Object.defineProperty(navigator, "modelContext", { configurable: true, value: { registerTool } })
    registerResearchTool()?.()
    expect(registerTool).toHaveBeenCalledOnce()
  })
})
