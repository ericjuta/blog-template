export type PagesAssetsBinding = {
  fetch: (input: Request | string) => Promise<Response>
}

export type PagesMiddlewareContext = {
  request: Request
  next: (input?: Request | string) => Promise<Response>
  env?: {
    ASSETS?: PagesAssetsBinding
  }
}

const markdownReaders = /ChatGPT-User|Claude-User|Perplexity-User|OAI-SearchBot|ClaudeBot|PerplexityBot/i
const cacheControl = "public, max-age=0, must-revalidate"
const negotiationHeaders = ["Accept", "User-Agent"]
const fallbackMarkdown = "# 404: Page not found\n\nThe requested path was not found on REA Research.\n\n- [Home](/)\n- [Research archive](/research)\n- [Site index](/llms.txt)\n"
const notFoundHeaders = [
  "Content-Security-Policy",
  "Content-Security-Policy-Report-Only",
  "Cross-Origin-Embedder-Policy",
  "Cross-Origin-Opener-Policy",
  "Cross-Origin-Resource-Policy",
  "Permissions-Policy",
  "Referrer-Policy",
  "Strict-Transport-Security",
  "Vary",
  "X-Content-Type-Options",
  "X-Frame-Options",
]

function mediaQuality(params: Array<string>): number | undefined {
  const param = params.find((value) => /^q(?:\s*=|$)/i.test(value.trim()))
  if (param === undefined) {
    return 1
  }
  const value = param.slice(param.indexOf("=") + 1).trim()
  // Ignore malformed weights rather than treating them as an explicit veto.
  return /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value) ? Number(value) : undefined
}

export function prefersMarkdown(request: Request): boolean {
  const accept = request.headers.get("Accept") ?? ""
  let markdownQuality: number | undefined
  let htmlQuality = 0

  // Delimiters inside quoted media parameters are not list or parameter separators.
  for (const range of accept.match(/(?:[^",]|"(?:[^"\\]|\\.)*")+/g) ?? []) {
    const [mediaType, ...params] = range.match(/(?:[^";]|"(?:[^"\\]|\\.)*")+/g) ?? []
    const type = mediaType?.trim().toLowerCase()
    if (type !== "text/markdown" && type !== "text/html") {
      continue
    }
    const quality = mediaQuality(params)
    if (quality === undefined) {
      continue
    }
    if (type === "text/markdown") {
      if (quality === 0) {
        return false
      }
      markdownQuality = Math.max(markdownQuality ?? 0, quality)
    } else {
      htmlQuality = Math.max(htmlQuality, quality)
    }
  }

  if (markdownQuality !== undefined) {
    return markdownQuality >= htmlQuality
  }
  return markdownReaders.test(request.headers.get("User-Agent") ?? "")
}

export function resolveMarkdownAssetPath(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "") || "/"
  if (pathname.startsWith("/.well-known/") || pathname.startsWith("/assets/")) {
    return null
  }
  if (normalized === "/" || normalized === "/index.html") {
    return "/index.md"
  }
  if (normalized.endsWith("/index.html")) {
    return `${normalized.slice(0, -"/index.html".length)}.md`
  }
  if (normalized.endsWith(".html")) {
    return `${normalized.slice(0, -".html".length)}.md`
  }
  if (/\.[^/]+$/.test(normalized)) {
    return null
  }
  return `${normalized}.md`
}

export function mergeVaryHeader(existing: string | null, tokens: Array<string>): string {
  const seen = new Set<string>()
  const vary: Array<string> = []
  for (const value of [...(existing?.split(",") ?? []), ...tokens]) {
    const token = value.trim()
    if (token === "*") {
      return "*"
    }
    const key = token.toLowerCase()
    if (key && !seen.has(key)) {
      seen.add(key)
      vary.push(token)
    }
  }
  return vary.join(", ")
}

export function estimateMarkdownTokens(markdown: string): string {
  return String(Math.max(1, Math.ceil(markdown.length / 4)))
}

function isMarkdownAsset(response: Response): boolean {
  return response.ok && !(response.headers.get("Content-Type") ?? "").toLowerCase().includes("text/html")
}

export async function onRequest(context: PagesMiddlewareContext): Promise<Response> {
  const { request } = context
  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next()
  }

  const url = new URL(request.url)
  const mdAssetPath = resolveMarkdownAssetPath(url.pathname)
  if (mdAssetPath === null) {
    return context.next()
  }

  function fetchStaticAsset(assetPath: string, method: "GET" | "HEAD"): Promise<Response> {
    // Make the path relative so even a leading // stays on the request's origin.
    const assetReq = new Request(new URL(`.${assetPath}`, url.origin).toString(), { method })
    return context.env?.ASSETS ? context.env.ASSETS.fetch(assetReq) : context.next(assetReq)
  }

  if (!prefersMarkdown(request)) {
    const response = await context.next()
    const headers = new Headers(response.headers)
    headers.set("Vary", mergeVaryHeader(headers.get("Vary"), negotiationHeaders))
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }

  // HEAD uses the GET representation to calculate the same token count.
  const assetRes = await fetchStaticAsset(mdAssetPath, "GET")
  let body: string
  let headers: Headers
  let status: number
  if (isMarkdownAsset(assetRes)) {
    body = await assetRes.text()
    headers = new Headers(assetRes.headers)
    status = 200
    if (!headers.has("Cache-Control")) {
      headers.set("Cache-Control", cacheControl)
    }
  } else {
    body = fallbackMarkdown
    headers = new Headers()
    status = 404
    try {
      const notFoundRes = await fetchStaticAsset("/404.md", "GET")
      for (const name of notFoundHeaders) {
        const value = notFoundRes.headers.get(name)
        if (value !== null) {
          headers.set(name, value)
        }
      }
      if (isMarkdownAsset(notFoundRes)) {
        body = await notFoundRes.text()
      }
    } catch {
      // The optional 404 asset is unavailable; keep the built-in page.
    }
    headers.set("X-Robots-Tag", "noindex")
    headers.set("Cache-Control", cacheControl)
  }

  headers.set("Content-Type", "text/markdown; charset=utf-8")
  headers.set("Vary", mergeVaryHeader(headers.get("Vary"), negotiationHeaders))
  headers.set("x-markdown-tokens", estimateMarkdownTokens(body))
  return new Response(request.method === "HEAD" ? null : body, { status, headers })
}
