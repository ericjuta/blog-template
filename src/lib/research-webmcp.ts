import { BLOG_POSTS } from "../data/blog-data"
import { SITE_ORIGIN } from "./router"

type ResearchTool = {
  name: string
  description: string
  inputSchema: {
    type: "object"
    properties: Record<string, { type: "string"; description: string }>
    additionalProperties: false
  }
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean; consequentialHint: boolean }
  execute: (input: { query?: string }) => Promise<{ posts: Array<{
    title: string
    summary: string
    category: string
    published: string
    url: string
    markdownUrl: string
  }> }>
}

type ToolContext = {
  registerTool: (tool: ResearchTool, options: { signal: AbortSignal }) => void | Promise<void>
}

declare global {
  interface Document {
    readonly modelContext?: ToolContext
  }
  interface Navigator {
    readonly modelContext?: ToolContext
  }
}

export function registerResearchTool() {
  if (typeof document === "undefined") {return}
  const controller = new AbortController()
  const tool: ResearchTool = {
    name: "find_research_posts",
    description: "Find published REA Research articles by title, topic, author, or category. Returns matching summaries with links to the HTML and Markdown articles. Omit the query to list the archive.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Optional words to match, such as AgentEnv or evidence-first." } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
    execute: async (input) => {
      const query = typeof input?.query === "string" ? input.query : ""
      const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
      const posts = BLOG_POSTS.filter((post) => {
        const text = `${post.title} ${post.subtitle} ${post.category} ${post.authors}`.toLowerCase()
        return words.every((word) => text.includes(word))
      }).map((post) => {
        const url = `${SITE_ORIGIN}/posts/${post.slug}`
        return { title: post.title, summary: post.subtitle, category: post.category, published: post.date, url, markdownUrl: `${url}.md` }
      })
      return { posts }
    },
  }
  // Native registration is optional on browsers that do not have WebMCP yet.
  // Keep the SDK's interactive bridge separate from this read-only site tool.
  try {
    const options = { signal: controller.signal }
    const registered = document.modelContext
      ? document.modelContext.registerTool(tool, options)
      : navigator.modelContext?.registerTool(tool, options)
    Promise.resolve(registered).catch(() => controller.abort())
  } catch {
    controller.abort()
  }
  return () => controller.abort()
}
