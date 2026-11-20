import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"

const SITE_ORIGIN = "https://askgina-blog.pages.dev"
const SITE_NAME = "REA Research"
const SITE_DESCRIPTION =
  "Interactive technical reports combining Reverse Engineer Anything (REA) evidence provenance with Vercel UI SDK headless primitives and live agent bridges."
const SITE_IMAGE = `${SITE_ORIGIN}/og-image.png`
const DIST = fileURLToPath(new URL("../dist/", import.meta.url))

const template = readFileSync(join(DIST, "index.html"), "utf8")
const headPattern = /(<head\b[^>]*>)([\s\S]*?)(<\/head\s*>)/i
if (!headPattern.test(template)) throw new Error("Missing <head> in dist/index.html")

function loadPosts() {
  const source = readFileSync(new URL("../src/data/blog-data.ts", import.meta.url), "utf8")
  // The array is a JavaScript-compatible literal with a top-level closing bracket.
  // Extract just that initializer so the script also works on Node without TS support.
  const literal = source.match(/^export const BLOG_POSTS(?:\s*:[^=\r\n]+)?\s*=\s*(\[[\s\S]*?^\])[ \t]*;?[ \t]*\r?$/m)?.[1]
  if (!literal) throw new Error("Could not extract BLOG_POSTS from src/data/blog-data.ts")

  const slugs = new Set()
  return Array.from(runInNewContext(`(${literal})`, {}, { timeout: 1000 }), (post) => {
    if (typeof post.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) {
      throw new Error(`Invalid or duplicate blog post slug: ${post.slug}`)
    }
    slugs.add(post.slug)

    const published = new Date(`${post.date} UTC`)
    if (!Number.isFinite(published.getTime())) {
      throw new Error(`Invalid publication date for ${post.slug}: ${post.date}`)
    }
    return { ...post, published, url: `${SITE_ORIGIN}/posts/${post.slug}` }
  })
}

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
const escapeMarkup = (value) => value.replace(/[&<>"']/g, (character) => entities[character])
const serializeJsonLd = (data) =>
  JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/<(\/)?/g, (_, slash) =>
    slash ? "<\\/" : "\\u003c",
  )

function blogPosting(post, url = post.url) {
  return {
    "@type": "BlogPosting",
    headline: post.title,
    description: post.subtitle,
    datePublished: post.published.toISOString().slice(0, 10),
    author: { "@type": "Organization", name: post.authors },
    articleSection: post.category,
    url,
    image: SITE_IMAGE,
  }
}

function renderPage({ title, description, url, ogType = "website", jsonLd, noindex }) {
  return template.replace(headPattern, (_, open, head, close) => {
    // On reruns the home page template already contains its generated JSON-LD.
    head = head.replace(/[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>[ \t]*\r?\n?/gi, "")
    const tags = []
    if (title) {
      head = head
        .replace(/[ \t]*<title\b[^>]*>[\s\S]*?<\/title>[ \t]*\r?\n?/gi, "")
        .replace(/[ \t]*<link\b(?=[^>]*\srel=["']canonical["'])[^>]*>[ \t]*\r?\n?/gi, "")
        .replace(/[ \t]*<meta\b(?=[^>]*\s(?:name=["'](?:description|robots|twitter:title|twitter:description)["']|property=["']og:(?:type|title|description|url)["']))[^>]*>[ \t]*\r?\n?/gi, "")
      const safeTitle = escapeMarkup(title)
      const safeDescription = escapeMarkup(description)
      const safeUrl = escapeMarkup(url)
      tags.push(
        `<title>${safeTitle}</title>`,
        `<meta name="description" content="${safeDescription}" />`,
        `<link rel="canonical" href="${safeUrl}" />`,
        `<meta property="og:type" content="${escapeMarkup(ogType)}" />`,
        `<meta property="og:title" content="${safeTitle}" />`,
        `<meta property="og:description" content="${safeDescription}" />`,
        `<meta property="og:url" content="${safeUrl}" />`,
        `<meta name="twitter:title" content="${safeTitle}" />`,
        `<meta name="twitter:description" content="${safeDescription}" />`,
      )
    }
    if (noindex) tags.push('<meta name="robots" content="noindex" />')
    if (jsonLd) tags.push(`<script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>`)
    return `${open}${head.trimEnd()}\n    ${tags.join("\n    ")}\n  ${close}`
  })
}

function page(file, path, title, description, type) {
  const url = `${SITE_ORIGIN}${path}`
  return { file, title, description, url, jsonLd: { "@type": type, name: title, description, url } }
}

function renderFeed(posts) {
  const items = [...posts].sort((a, b) => b.published - a.published).map((post) => {
    const url = escapeMarkup(post.url)
    return `    <item>
      <title>${escapeMarkup(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${post.published.toUTCString()}</pubDate>
      <description>${escapeMarkup(post.subtitle)}</description>
    </item>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeMarkup(SITE_NAME)}</title>
    <link>${SITE_ORIGIN}/</link>
    <description>${escapeMarkup(SITE_DESCRIPTION)}</description>
    <atom:link href="${SITE_ORIGIN}/feed.xml" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>
`
}

const posts = loadPosts()
const flagship = posts.find((post) => post.featured)
if (!flagship) throw new Error("BLOG_POSTS must include a featured post for /")

const pages = [
  { file: "index.html", jsonLd: blogPosting(flagship, `${SITE_ORIGIN}/`) },
  page("research/index.html", "/research", `Research Archive | ${SITE_NAME}`, SITE_DESCRIPTION, "CollectionPage"),
  page(
    "design-system/index.html",
    "/design-system",
    `Design System Gallery | ${SITE_NAME}`,
    "An interactive Vercel UI SDK component gallery showcasing accessible states for REA Research interfaces.",
    "WebPage",
  ),
  ...posts.map((post) => ({
    file: `posts/${post.slug}/index.html`,
    title: `${post.title} | ${SITE_NAME}`,
    description: post.subtitle,
    url: post.url,
    ogType: "article",
    jsonLd: blogPosting(post),
  })),
  {
    file: "404.html",
    title: `404: Page Not Found | ${SITE_NAME}`,
    description: "The requested page could not be found on REA Research.",
    url: `${SITE_ORIGIN}/404`,
    noindex: true,
  },
]

for (const route of pages) {
  const output = join(DIST, route.file)
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, renderPage(route), "utf8")
}
writeFileSync(join(DIST, "feed.xml"), renderFeed(posts), "utf8")
console.log(`Generated ${pages.length} HTML pages and feed.xml in dist/.`)
