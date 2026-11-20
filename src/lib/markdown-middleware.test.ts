import { describe, expect, it, vi } from "vitest"
import {
  estimateMarkdownTokens,
  mergeVaryHeader,
  onRequest,
  prefersMarkdown,
  resolveMarkdownAssetPath,
} from "../../functions/_middleware"
import type { PagesAssetsBinding, PagesMiddlewareContext } from "../../functions/_middleware"

const origin = "https://research.example"
const markdownType = "text/markdown; charset=utf-8"
const defaultCacheControl = "public, max-age=0, must-revalidate"
const markdownBody = "# REA Research\n\nPublished Markdown.\n"
const notFoundPath = "/does-not-exist"
const markdownRoutes = [
  ["/", "/index.md"],
  ["/posts/agent-environments", "/posts/agent-environments.md"],
  ["/research", "/research.md"],
  ["/design-system", "/design-system.md"],
]
const staticPaths = [
  "/assets/app.js",
  "/favicon.svg",
  "/posts/evidence-first-ui.md",
  "/feed.xml",
  "/.well-known/ard.json",
  "/assets/",
  "/.well-known/",
  "/assets/extensionless",
  "/.well-known/extensionless",
  "/robots.txt",
  "/sitemap.xml",
]
const markdownAssetPaths = new Set(markdownRoutes.map(([, assetPath]) => assetPath))

function mockContext(path: string, init?: RequestInit) {
  const request = new Request(`${origin}${path}`, init)
  const pathname = new URL(request.url).pathname
  const next = vi.fn<PagesMiddlewareContext["next"]>().mockImplementation(() => {
    const missing = pathname === notFoundPath
    return Promise.resolve(new Response(request.method === "HEAD" ? null : "<h1>HTML page</h1>", {
      status: missing ? 404 : 200,
      statusText: missing ? "Not Found" : "OK",
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }))
  })
  const fetch = vi.fn<PagesAssetsBinding["fetch"]>().mockImplementation((input) => {
    const assetPath = new URL(typeof input === "string" ? input : input.url).pathname
    if (markdownAssetPaths.has(assetPath)) {
      return Promise.resolve(new Response(markdownBody, { headers: { "Content-Type": "text/plain" } }))
    }
    return Promise.resolve(new Response("<h1>Not found</h1>", { status: 404, headers: { "Content-Type": "text/html" } }))
  })
  return { context: { request, next, env: { ASSETS: { fetch } } }, next, fetch }
}

describe("prefersMarkdown", () => {
  it.each([
    ["text/markdown", true],
    ["text/html, text/markdown", true],
    ["TEXT/HTML;q=0.500, TEXT/MARKDOWN; Q = 0.500", true],
    ["text/markdown;q=0.2, text/html;q=0", true],
    ["text/markdown;q=0.5, text/html;q=0.9", false],
    ["text/markdown;q=0", false],
    ["text/markdown;q=1.2", false],
    ["text/markdown;q", false],
    ["text/html,application/xhtml+xml,*/*;q=0.8", false],
    ['text/html;profile="x,text/markdown,y"', false],
    ['text/markdown;profile="x;q=0", text/html', true],
    ["text/*, */*", false],
  ])("evaluates %s as %s", (accept, expected) => {
    expect(prefersMarkdown(new Request(origin, { headers: { Accept: accept } }))).toBe(expected)
  })

  it("does not let a bot override explicit Markdown weights", () => {
    for (const accept of ["text/markdown;q=0.000", "text/markdown;q=0.4, text/html", "text/markdown, text/markdown;q=0"]) {
      const request = new Request(origin, { headers: { Accept: accept, "User-Agent": "chatgpt-user" } })
      expect(prefersMarkdown(request)).toBe(false)
    }
  })

  it("uses the bot preference when a Markdown weight is malformed, not zero", () => {
    const request = new Request(origin, { headers: { Accept: "text/markdown;q=1.2, text/html", "User-Agent": "ClaudeBot" } })
    expect(prefersMarkdown(request)).toBe(true)
  })

  it("defaults to HTML when both negotiation headers are absent", () => {
    expect(prefersMarkdown(new Request(origin))).toBe(false)
  })
})

describe("resolveMarkdownAssetPath", () => {
  it.each([
    ...markdownRoutes,
    ["///", "/index.md"],
    ["/index.html", "/index.md"],
    ["/research///", "/research.md"],
    ["/research.html", "/research.md"],
    ["/research/index.html", "/research.md"],
  ])("maps %s to %s", (path, assetPath) => {
    expect(resolveMarkdownAssetPath(path)).toBe(assetPath)
  })

  it.each([...staticPaths, "/assets/example.html", "/.well-known/example.html"])("excludes %s", (path) => {
    expect(resolveMarkdownAssetPath(path)).toBeNull()
  })
})

describe("mergeVaryHeader", () => {
  it("adds missing tokens in order", () => {
    expect(mergeVaryHeader(null, ["Accept", "User-Agent"])).toBe("Accept, User-Agent")
    expect(mergeVaryHeader("Accept-Encoding, accept", ["Accept", "User-Agent"])).toBe("Accept-Encoding, accept, User-Agent")
  })

  it("deduplicates case-insensitively and preserves a wildcard", () => {
    expect(mergeVaryHeader("origin, Origin, user-agent", ["User-Agent", "Accept", "accept"])).toBe("origin, user-agent, Accept")
    expect(mergeVaryHeader("*", ["Accept", "User-Agent"])).toBe("*")
  })
})

it("estimates Markdown tokens with rounding and a minimum of one", () => {
  expect(estimateMarkdownTokens("")).toBe("1")
  expect(estimateMarkdownTokens("1234")).toBe("1")
  expect(estimateMarkdownTokens("12345")).toBe("2")
})

describe("onRequest", () => {
  it.each(markdownRoutes)("serves %s as Markdown from %s", async (path, assetPath) => {
    const { context, next, fetch } = mockContext(`${path}?source=test`, { headers: { Accept: "text/markdown" } })
    const response = await onRequest(context)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe(markdownType)
    expect(response.headers.get("Vary")).toBe("Accept, User-Agent")
    expect(response.headers.get("x-markdown-tokens")).toBe("9")
    expect(response.headers.get("Cache-Control")).toBe(defaultCacheControl)
    expect(await response.text()).toBe(markdownBody)
    expect(fetch).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ url: `${origin}${assetPath}`, method: "GET" }))
    expect(next).not.toHaveBeenCalled()
  })

  it.each([
    ["text/markdown;q=0.5, text/html;q=0.9", "Mozilla/5.0"],
    ["text/html,application/xhtml+xml,*/*;q=0.8", "Mozilla/5.0"],
    ["text/markdown;q=0, text/html", "Claude-User"],
  ])("serves HTML with both Vary tokens for %s", async (accept, userAgent) => {
    const { context, next, fetch } = mockContext("/research", {
      headers: { Accept: accept, "User-Agent": userAgent },
    })
    const response = await onRequest(context)

    expect(response.status).toBe(200)
    expect(response.statusText).toBe("OK")
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8")
    expect(response.headers.get("Vary")).toBe("Accept, User-Agent")
    expect(response.headers.has("x-markdown-tokens")).toBe(false)
    expect(await response.text()).toBe("<h1>HTML page</h1>")
    expect(next).toHaveBeenCalledExactlyOnceWith()
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(["ChatGPT-User", "Claude-User", "Perplexity-User", "OAI-SearchBot", "ClaudeBot", "PerplexityBot"])(
    "serves Markdown for %s despite an HTML-only Accept header",
    async (bot) => {
      const { context } = mockContext("/research", {
        headers: { Accept: "text/html", "User-Agent": `Mozilla/5.0 (${bot.toLowerCase()}/1.0)` },
      })
      const response = await onRequest(context)
      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe(markdownType)
      expect(response.headers.get("Vary")).toBe("Accept, User-Agent")
      expect(await response.text()).toBe(markdownBody)
    },
  )

  it("preserves asset headers and calculates GET token metadata for HEAD", async () => {
    const { context, fetch } = mockContext("/design-system", { method: "HEAD", headers: { Accept: "text/markdown" } })
    fetch.mockResolvedValueOnce(new Response(markdownBody, {
      headers: { Vary: "Accept-Encoding, accept", "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff" },
    }))
    const response = await onRequest(context)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe(markdownType)
    expect(response.headers.get("x-markdown-tokens")).toBe("9")
    expect(response.headers.get("Vary")).toBe("Accept-Encoding, accept, User-Agent")
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60")
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff")
    expect(response.body).toBeNull()
    expect(await response.text()).toBe("")
    expect(fetch).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ url: `${origin}/design-system.md`, method: "GET" }))
  })

  it("uses the rewritten next request if ASSETS is unavailable", async () => {
    const { context, next, fetch } = mockContext("/index.html", { headers: { Accept: "text/markdown" } })
    next.mockResolvedValueOnce(new Response(markdownBody))
    const response = await onRequest({ request: context.request, next })

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe(markdownType)
    expect(next).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ url: `${origin}/index.md`, method: "GET" }))
    expect(fetch).not.toHaveBeenCalled()
  })

  it("keeps Markdown asset requests on the original origin even for paths starting with //", async () => {
    const { context, fetch } = mockContext("//elsewhere.example/research", { headers: { Accept: "text/markdown" } })
    await onRequest(context)
    expect(fetch).toHaveBeenNthCalledWith(1, expect.objectContaining({ url: `${origin}//elsewhere.example/research.md` }))
  })

  it("serves a built-in Markdown 404 when neither Markdown asset exists", async () => {
    const { context, fetch, next } = mockContext(notFoundPath, { headers: { Accept: "text/markdown" } })
    const response = await onRequest(context)
    const body = await response.text()

    expect(response.status).toBe(404)
    expect(response.headers.get("Content-Type")).toBe(markdownType)
    expect(response.headers.get("Vary")).toBe("Accept, User-Agent")
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex")
    expect(response.headers.get("Cache-Control")).toBe(defaultCacheControl)
    expect(response.headers.get("x-markdown-tokens")).toBe(estimateMarkdownTokens(body))
    expect(body).toContain("/llms.txt")
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenNthCalledWith(1, expect.objectContaining({ url: `${origin}${notFoundPath}.md`, method: "GET" }))
    expect(fetch).toHaveBeenNthCalledWith(2, expect.objectContaining({ url: `${origin}/404.md`, method: "GET" }))
    expect(next).not.toHaveBeenCalled()
  })

  it.each(["GET", "HEAD"])("rejects a 200 HTML SPA fallback and uses custom 404 Markdown for %s", async (method) => {
    const { context, fetch } = mockContext(notFoundPath, { method, headers: { Accept: "text/markdown" } })
    const notFoundBody = "# Custom not found\n"
    fetch
      .mockResolvedValueOnce(new Response("<h1>SPA shell</h1>", { headers: { "Content-Type": "Text/HTML; charset=utf-8" } }))
      .mockResolvedValueOnce(new Response(notFoundBody, {
        headers: { "Content-Type": markdownType, "Content-Security-Policy": "default-src 'none'", Vary: "Origin" },
      }))
    const response = await onRequest(context)

    expect(response.status).toBe(404)
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex")
    expect(response.headers.get("Vary")).toBe("Origin, Accept, User-Agent")
    expect(response.headers.get("Content-Security-Policy")).toBe("default-src 'none'")
    expect(response.headers.get("x-markdown-tokens")).toBe("5")
    expect(await response.text()).toBe(method === "HEAD" ? "" : notFoundBody)
  })

  it("rejects HTML at /404.md but preserves its security headers", async () => {
    const { context, fetch } = mockContext(notFoundPath, { headers: { Accept: "text/markdown" } })
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response("<h1>Not Markdown</h1>", {
        headers: { "Content-Type": "text/html", "X-Frame-Options": "DENY", "Content-Length": "21" },
      }))
    const response = await onRequest(context)
    expect(response.status).toBe(404)
    expect(response.headers.get("X-Frame-Options")).toBe("DENY")
    expect(response.headers.has("Content-Length")).toBe(false)
    expect(await response.text()).toContain("/llms.txt")
  })

  it("uses the built-in page when fetching the optional 404 asset rejects", async () => {
    const { context, fetch } = mockContext(notFoundPath, { headers: { Accept: "text/markdown" } })
    fetch.mockResolvedValueOnce(new Response(null, { status: 404 })).mockRejectedValueOnce(new Error("Asset unavailable"))
    const response = await onRequest(context)
    expect(response.status).toBe(404)
    expect(await response.text()).toContain("/llms.txt")
  })

  it("passes through an HTML 404 with the original headers plus Vary", async () => {
    const { context, next, fetch } = mockContext(notFoundPath, { headers: { Accept: "text/html" } })
    const downstream = new Response("<h1>Not found</h1>", {
      status: 404,
      statusText: "Not Found",
      headers: { "Content-Type": "text/html", Vary: "Accept-Encoding, user-agent", "X-Robots-Tag": "noindex" },
    })
    next.mockResolvedValueOnce(downstream)
    const response = await onRequest(context)

    expect(response.status).toBe(404)
    expect(response.statusText).toBe("Not Found")
    expect(response.headers.get("Content-Type")).toBe("text/html")
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex")
    expect(response.headers.get("Vary")).toBe("Accept-Encoding, user-agent, Accept")
    expect(downstream.headers.get("Vary")).toBe("Accept-Encoding, user-agent")
    expect(await response.text()).toBe("<h1>Not found</h1>")
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(staticPaths)("leaves requests to %s untouched", async (path) => {
    const { context, next, fetch } = mockContext(path, { headers: { Accept: "text/markdown" } })
    const downstream = new Response("Static asset", { headers: { Vary: "Accept-Encoding" } })
    next.mockResolvedValueOnce(downstream)
    expect(await onRequest(context)).toBe(downstream)
    expect(next).toHaveBeenCalledExactlyOnceWith()
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(["POST", "OPTIONS"])("does not negotiate %s", async (method) => {
    const { context, next, fetch } = mockContext("/research", { method, headers: { Accept: "text/markdown" } })
    const downstream = new Response(null, { status: 204 })
    next.mockResolvedValueOnce(downstream)
    expect(await onRequest(context)).toBe(downstream)
    expect(next).toHaveBeenCalledExactlyOnceWith()
    expect(fetch).not.toHaveBeenCalled()
  })
})
