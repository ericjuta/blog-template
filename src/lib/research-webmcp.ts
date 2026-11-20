import { BLOG_POSTS } from "../data/blog-data"
import { SITE_ORIGIN } from "./router"

type PublishedPost = (typeof posts)[number]

type ResearchPage = {
  title: string
  url: string
  markdownUrl: string
  children?: Array<PublishedPost>
}

type ResearchToolInput = { query?: string; slug?: string }
type ResearchToolResult =
  | { posts: Array<PublishedPost> }
  | { pages: Array<ResearchPage> }
  | { url: string; markdown: string }
  | { error: string; url?: string }

type ResearchTool = {
  name: string
  description: string
  inputSchema: {
    type: "object"
    properties: Record<string, { type: "string"; description: string }>
    required?: Array<string>
    additionalProperties: false
  }
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean; consequentialHint: boolean }
  execute: (input: ResearchToolInput, options?: { signal: AbortSignal }) => Promise<ResearchToolResult>
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

const posts = BLOG_POSTS.map((post) => {
  const path = `/posts/${post.slug}`
  return {
    slug: post.slug,
    title: post.title,
    summary: post.subtitle,
    authors: post.authors,
    category: post.category,
    published: post.date,
    path,
    url: `${SITE_ORIGIN}${path}`,
    markdownUrl: `${SITE_ORIGIN}${path}.md`,
  }
})

const findTool: ResearchTool = {
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
    return { posts: posts.filter((post) => {
      const text = `${post.title} ${post.summary} ${post.category} ${post.authors}`.toLowerCase()
      return words.every((word) => text.includes(word))
    }) }
  },
}

const readTool: ResearchTool = {
  name: "read_research_post",
  description: "Read a published research article as Markdown, including its findings and references. Returns the article body and canonical HTML URL for citation.",
  inputSchema: {
    type: "object",
    properties: { slug: { type: "string", description: "Exact article slug returned by find_research_posts or list_research_pages." } },
    required: ["slug"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
  execute: async (input, options) => {
    const post = posts.find((entry) => entry.slug === input?.slug)
    if (!post) {return { error: "Unknown article slug. Use find_research_posts or list_research_pages to choose a published post." }}
    const response = await fetch(`${post.path}.md`, { signal: options?.signal, redirect: "error" })
    if (!response.ok || !response.headers.get("content-type")?.startsWith("text/markdown")) {
      return { error: "Article Markdown is unavailable.", url: post.url }
    }
    return { url: post.url, markdown: await response.text() }
  },
}

const listTool: ResearchTool = {
  name: "list_research_pages",
  description: "Navigate the site's documentation tree: list the research archive and its articles, the featured report, and the design-system gallery, with HTML and Markdown links.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
  execute: async () => ({ pages: [
    { title: "Featured report", url: `${SITE_ORIGIN}/`, markdownUrl: `${SITE_ORIGIN}/index.md` },
    { title: "Research archive", url: `${SITE_ORIGIN}/research`, markdownUrl: `${SITE_ORIGIN}/research.md`, children: posts },
    { title: "Design system gallery", url: `${SITE_ORIGIN}/design-system`, markdownUrl: `${SITE_ORIGIN}/design-system.md` },
  ] }),
}

export function registerResearchTools() {
  if (typeof document === "undefined") {return}
  const controller = new AbortController()
  const options = { signal: controller.signal }
  // Native registration is optional. Keep all three tools separate from the
  // SDK's interactive figure bridge. Abort pending registrations on teardown.
  const registerFind = async () => document.modelContext
    ? document.modelContext.registerTool(findTool, options)
    : navigator.modelContext?.registerTool(findTool, options)
  const registerRead = async () => document.modelContext
    ? document.modelContext.registerTool(readTool, options)
    : navigator.modelContext?.registerTool(readTool, options)
  const registerList = async () => document.modelContext
    ? document.modelContext.registerTool(listTool, options)
    : navigator.modelContext?.registerTool(listTool, options)
  void Promise.allSettled([registerFind(), registerRead(), registerList()])
  return () => controller.abort()
}
