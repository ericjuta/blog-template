import { afterEach, describe, expect, it, vi } from "vitest"
import { registerResearchTools } from "./research-webmcp"

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext")
  Reflect.deleteProperty(navigator, "modelContext")
  vi.unstubAllGlobals()
})

type RegisterTool = NonNullable<Document["modelContext"]>["registerTool"]

describe("research WebMCP tool", () => {
  it("prefers document.modelContext and returns matching published articles", async () => {
    const registerTool = vi.fn<RegisterTool>()
    const fallback = vi.fn<RegisterTool>()
    Object.defineProperty(document, "modelContext", { configurable: true, value: { registerTool } })
    Object.defineProperty(navigator, "modelContext", { configurable: true, value: { registerTool: fallback } })

    const dispose = registerResearchTools()
    expect(registerTool).toHaveBeenCalledTimes(3)
    expect(fallback).not.toHaveBeenCalled()
    const [tool, { signal }] = registerTool.mock.calls[0]
    expect(tool.name).toBe("find_research_posts")
    expect(tool.annotations.readOnlyHint).toBe(true)
    expect(signal.aborted).toBe(false)
    expect(await tool.execute({})).toEqual({ posts: expect.any(Array) })
    expect(await tool.execute({ query: "AgentEnv offline" })).toEqual({ posts: [
      expect.objectContaining({ title: expect.stringContaining("AgentEnv"), markdownUrl: expect.stringMatching(/\/agent-environments\.md$/) }),
    ] })
    expect(await tool.execute({ query: "not-a-research-topic" })).toEqual({ posts: [] })
    dispose?.()
    expect(signal.aborted).toBe(true)
  })

  it("lists navigable pages and reads only a published Markdown route", async () => {
    const registerTool = vi.fn<RegisterTool>()
    Object.defineProperty(document, "modelContext", { configurable: true, value: { registerTool } })
    const fetchFixture = vi.fn().mockResolvedValue(new Response("# Published article", {
      headers: { "content-type": "text/markdown; charset=utf-8" },
    }))
    vi.stubGlobal("fetch", fetchFixture)
    const dispose = registerResearchTools()
    const [, [read], [list]] = registerTool.mock.calls
    expect(list.name).toBe("list_research_pages")
    expect(await list.execute({})).toEqual({ pages: expect.arrayContaining([
      expect.objectContaining({ title: "Research archive", children: expect.arrayContaining([
        expect.objectContaining({ slug: "agent-environments" }),
      ]) }),
    ]) })
    expect(await read.execute({ slug: "https://unrelated.example" })).toEqual({ error: expect.stringContaining("Unknown article") })
    expect(fetchFixture).not.toHaveBeenCalled()
    expect(await read.execute({ slug: "agent-environments" })).toEqual({
      url: "https://askgina-blog.pages.dev/posts/agent-environments", markdown: "# Published article",
    })
    expect(fetchFixture).toHaveBeenCalledWith("/posts/agent-environments.md", expect.objectContaining({ redirect: "error" }))
    dispose?.()
  })

  it("accepts a legacy navigator implementation and tolerates unsupported browsers", () => {
    expect(() => registerResearchTools()?.()).not.toThrow()
    const registerTool = vi.fn<RegisterTool>()
    Object.defineProperty(navigator, "modelContext", { configurable: true, value: { registerTool } })
    registerResearchTools()?.()
    expect(registerTool).toHaveBeenCalledTimes(3)
  })
})
