import { createHash } from "node:crypto"
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { prerender } from "react-dom/static"
import TurndownService from "turndown"
import { App } from "../src/App.tsx"
import { BLOG_POSTS } from "../src/data/blog-data.ts"
import { parseRoute } from "../src/lib/router.ts"
import { DEFAULT_SITE_ORIGIN, SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "../src/lib/site.ts"
import { generateOgAssets } from "./generate-og-assets.mjs"

const HOME = `${SITE_ORIGIN}/`
const SITE_IMAGE = `${SITE_ORIGIN}/og-image.png`
const WEBSITE_ID = `${HOME}#website`
const PUBLISHER_ID = `${HOME}#publisher`
const RESEARCH_PATH = "/research"
const RESEARCH_TITLE = "Research Archive"
const ARD_PATH = "/.well-known/ard.json"
const DIST = fileURLToPath(new URL("../dist/", import.meta.url))

const latinFont = readdirSync(join(DIST, "assets"), { withFileTypes: true })
  .filter((entry) => entry.isFile() && /^geist-latin-wght-normal-[^.]+\.woff2$/.test(entry.name))
  .map((entry) => entry.name).sort()[0]
if (!latinFont) throw new Error("Missing Geist Latin variable font (geist-latin-wght-normal-*.woff2) in dist/assets")

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
const escapeMarkup = (value) => value.replace(/[&<>"']/g, (character) => entities[character])
const template = readFileSync(join(DIST, "index.html"), "utf8")
  .replaceAll(DEFAULT_SITE_ORIGIN, () => escapeMarkup(SITE_ORIGIN))
const headPattern = /(<head\b[^>]*>)([\s\S]*?)(<\/head\s*>)/i
if (!headPattern.test(template)) throw new Error("Missing <head> in dist/index.html")

const rootMarker = '<div id="root"></div>'
if (!template.includes(rootMarker)) throw new Error("Missing empty mount node in the Vite template")

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
const publicationDateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC", month: "long", day: "numeric", year: "numeric",
})

function toIsoDate(date, slug) {
  const parsed = new Date(isoDatePattern.test(date) ? date : `${date} UTC`)
  if (Number.isFinite(parsed.getTime())) {
    const iso = parsed.toISOString().slice(0, 10)
    // Reject dates that Date silently rolls over, such as February 30.
    if (isoDatePattern.test(iso) && (date === iso || date === publicationDateFormat.format(parsed))) {
      return iso
    }
  }
  throw new Error(`Invalid publication date for ${slug}: ${date}`)
}

const slugs = new Set()
const posts = BLOG_POSTS.map((post) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) {
    throw new Error(`Invalid or duplicate blog post slug: ${post.slug}`)
  }
  slugs.add(post.slug)

  const lastmod = toIsoDate(post.date, post.slug)
  const path = `/posts/${post.slug}`
  return { ...post, lastmod, published: new Date(lastmod), path, url: `${SITE_ORIGIN}${path}` }
})

const serializeJsonLd = (data) =>
  JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/<(\/)?/g, (_, slash) =>
    slash ? "<\\/" : "\\u003c",
  )

const postImage = (post) => `${SITE_ORIGIN}/og/${post.slug}.png`

function blogPosting(post) {
  return {
    "@type": "BlogPosting",
    "@id": `${post.url}#article`,
    name: post.title,
    headline: post.title,
    description: post.subtitle,
    datePublished: post.lastmod,
    author: { "@type": "Organization", name: post.authors },
    articleSection: post.category,
    publisher: { "@id": PUBLISHER_ID },
    isPartOf: { "@id": WEBSITE_ID },
    url: post.url,
    image: postImage(post),
  }
}

const publisher = {
  "@type": "Organization",
  "@id": PUBLISHER_ID,
  name: "Ask Gina",
  url: "https://askgina.ai/",
  sameAs: ["https://github.com/askgina"],
}
const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  url: HOME,
  description: SITE_DESCRIPTION,
  publisher: { "@id": PUBLISHER_ID },
}

function breadcrumbs(route) {
  const items = [[SITE_NAME, HOME]]
  if (route.post) items.push([RESEARCH_TITLE, `${SITE_ORIGIN}${RESEARCH_PATH}`])
  items.push([route.name, route.url])
  return {
    "@type": "BreadcrumbList",
    "@id": `${route.url}#breadcrumbs`,
    name: `Breadcrumbs for ${route.name}`,
    url: route.url,
    itemListElement: items.map(([name, item], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item,
    })),
  }
}

function renderPage(route, markup) {
  const { title, description, url, ogType = "website", entity, noindex, markdownPath, image = SITE_IMAGE } = route
  const body = template.replace(rootMarker, () => `<div id="root">${markup}</div>`)
  return body.replace(headPattern, (_, open, head, close) => {
    head = head.replace(/[ \t]*<meta\b(?=[^>]*\s(?:property=["']og:image["']|name=["']twitter:image["']))[^>]*>[ \t]*\r?\n?/gi, "")
    const safeImage = escapeMarkup(image)
    const tags = [
      `<meta name="rea-site-origin" content="${escapeMarkup(SITE_ORIGIN)}" />`,
      `<link rel="preload" href="/assets/${escapeMarkup(latinFont)}" as="font" type="font/woff2" crossorigin />`,
      `<meta property="og:image" content="${safeImage}" />`,
      `<meta name="twitter:image" content="${safeImage}" />`,
    ]
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
    if (route.path === "/") tags.push(`<link rel="ard" href="${ARD_PATH}" />`)
    if (markdownPath) {
      tags.push(`<link rel="alternate" type="text/markdown" href="${SITE_ORIGIN}${markdownPath}" />`)
    }
    if (entity) {
      const graph = [entity, website, publisher]
      if (route.path !== "/") graph.push(breadcrumbs(route))
      tags.push(`<script type="application/ld+json">${serializeJsonLd({ "@graph": graph })}</script>`)
    }
    return `${open}${head.trimEnd()}\n    ${tags.join("\n    ")}\n  ${close}`
  })
}

function page(path, name, description, type) {
  const url = `${SITE_ORIGIN}${path}`
  return {
    path,
    file: `${path.slice(1)}/index.html`,
    markdownPath: `${path}.md`,
    title: `${name} | ${SITE_NAME}`,
    name,
    description,
    url,
    entity: { "@type": type, name, description, url, isPartOf: { "@id": WEBSITE_ID } },
  }
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

const flagship = posts.find((post) => post.featured)
if (!flagship) throw new Error("BLOG_POSTS must include a featured post for /")
const latestLastmod = posts.reduce((latest, post) => post.lastmod > latest ? post.lastmod : latest, flagship.lastmod)

const notFound = {
  path: "/404",
  file: "404.html",
  title: `404: Page Not Found | ${SITE_NAME}`,
  description: `The requested page could not be found on ${SITE_NAME}.`,
  url: `${SITE_ORIGIN}/404`,
  noindex: true,
}

const pages = [
  {
    path: "/",
    file: "index.html",
    markdownPath: "/index.md",
    name: flagship.title,
    description: flagship.subtitle,
    url: HOME,
    image: postImage(flagship),
    entity: { ...blogPosting(flagship), mainEntityOfPage: HOME },
    post: flagship,
  },
  page(RESEARCH_PATH, RESEARCH_TITLE, SITE_DESCRIPTION, "CollectionPage"),
  page(
    "/design-system",
    "Design System Gallery",
    "An interactive Vercel UI SDK component gallery showcasing accessible states for REA Research interfaces.",
    "WebPage",
  ),
  ...posts.map((post) => ({
    ...page(post.path, post.title, post.subtitle, "BlogPosting"),
    ogType: "article",
    image: postImage(post),
    entity: blogPosting(post),
    post,
  })),
  notFound,
]

function write(relativeFile, contents) {
  const output = join(DIST, relativeFile)
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, contents, "utf8")
}

generateOgAssets(DIST, posts)

const markdown = new Map()
const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" })
for (const route of pages) {
  const initialRoute = route.noindex ? { kind: "not-found", pathname: "" } : parseRoute(route.path)
  const app = createElement(App, { initialRoute })
  // Resolve React.lazy figures before emitting script-free HTML. React's streamed
  // prelude uses inline scripts to move late boundaries, which our Pages CSP forbids.
  const { prelude } = await prerender(app)
  await prelude.cancel()
  const markup = renderToStaticMarkup(app)
  if (!markup.includes("<h1") || /<script[\s>]|<template[\s>]/i.test(markup)) {
    throw new Error(`Expected complete, script-free prerender for ${route.path}`)
  }
  write(route.file, renderPage(route, markup))

  if (route.markdownPath) {
    const { window } = new JSDOM(markup, { url: route.url })
    try {
      const content = window.document.querySelector(route.post ? "main .article-column" : "main")
      const heading = content?.querySelector("h1")
      if (!heading?.textContent?.trim()) throw new Error(`Missing content heading for ${route.path}`)
      const headline = turndown.turndown(heading.outerHTML)
      heading.remove()
      for (const figure of content.querySelectorAll("figure")) {
        const paragraph = window.document.createElement("p")
        const link = window.document.createElement("a")
        link.href = figure.closest("section[id]") ? `#${figure.closest("section[id]").id}` : route.url
        link.textContent = figure.querySelector(".figure-title")?.textContent?.trim() ?? "Interactive figure"
        paragraph.append("Interactive figure: ", link, ".")
        figure.replaceWith(paragraph)
      }
      for (const note of content.querySelectorAll(".sidenote")) {
        const text = note.querySelector(".sidenote-text")?.textContent?.trim()
        const source = note.querySelector("a[href]")
        if (text) {
          note.before(" (", text)
          if (source) note.before(" Source: ", source.cloneNode(true), ".")
          note.before(")")
        }
        note.remove()
      }
      const uiOnly = [
        "svg", '[aria-hidden="true"]', "button", "input", "select", "textarea", "[hidden]",
        ".citation-inline", ".article-meta", ".pill-badge", "a.btn-ghost",
      ]
      content.querySelectorAll(uiOnly.join(", ")).forEach((element) => element.remove())
      for (const link of content.querySelectorAll("a[href]")) link.href = link.href
      const byline = route.post ? `Published ${route.post.date} · ${route.post.authors}\n\n` : ""
      const body = turndown.turndown(content.innerHTML)
      const document = `${headline}\n\n[HTML version](${route.url})\n\n${byline}${body}\n`
      const metadata = [
        "---",
        `title: ${JSON.stringify(heading.textContent.trim())}`,
        `description: ${JSON.stringify(route.description)}`,
        `canonical: ${JSON.stringify(route.url)}`,
        "---",
        "",
      ].join("\n")
      markdown.set(route.path, document)
      write(route.markdownPath.slice(1), `${metadata}\n${document}`)
    } finally {
      window.close()
    }
  }
}

write("404.md", `---
title: ${JSON.stringify(notFound.title)}
status: 404
canonical: ${JSON.stringify(notFound.url)}
---

# 404: Page Not Found

${notFound.description} Try one of these links:

- [Home / featured report](${HOME})
- [Research archive](${SITE_ORIGIN}${RESEARCH_PATH})
- [Machine-readable site index](${HOME}llms.txt)
- [Research post index](${HOME}posts/llms.txt)
- [RSS feed](${HOME}feed.xml)
`)

const sectionIndex = `# ${SITE_NAME}: Research posts

> Technical reports, case studies, and research on evidence-first interfaces and offline agent environments.

## Posts

${posts.map((post) => `- [${post.title}](${post.url}.md): ${post.subtitle}`).join("\n")}
`
write("posts/llms.txt", sectionIndex)
write("design-system/llms.txt", `# ${SITE_NAME}: Design system

> Examples of the UI SDK primitives used in the research demonstrations, including keyboard navigation and accessible interaction states.

## Gallery

- [Component gallery in Markdown](${HOME}design-system.md): Overview of the examples and their intended interactions.
- [Interactive component gallery](${HOME}design-system): Try the buttons, switches, tabs, citation popovers, EvidenceStepper, and Waterfall with JavaScript.
- [Evidence-first interfaces report](${flagship.url}.md): How the research uses these primitives to make figures inspectable.
`)
write("llms.txt", `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## When to use this site

Use this publication to find case studies on evidence provenance and agent-addressable interfaces, compare the reported WebMCP benchmarks, or read about recorded interactions as offline agent environments. Fetch the Markdown for the relevant article with an ordinary HTTP GET and cite its linked HTML source. Use the interactive HTML for hands-on figures; this blog does not offer a hosted API or MCP service.

## Research

- [Featured report](${HOME}index.md): ${flagship.title}.
- [Research archive](${SITE_ORIGIN}${RESEARCH_PATH}.md): Browse the published reports and case studies.
- [Research post index](${HOME}posts/llms.txt): Choose a post by topic.
- [Design system index](${HOME}design-system/llms.txt): UI SDK component examples.

## Optional

- [All posts in one file](${HOME}llms-full.txt): Article text and references for every research post; interactive figures are linked.
- [RSS feed](${HOME}feed.xml): Follow new articles.
- [Read REA Research skill](${HOME}.well-known/agent-skills/read-rea-research/SKILL.md): Find articles, read evidence in context, and cite primary sources.
`)
write("llms-full.txt", `# ${SITE_NAME}: Collected research posts\n\n${posts.map((post) => markdown.get(post.path)).join("\n---\n\n")}`)

const sitemapEntries = pages.filter((route) => !route.noindex).map((route) => `  <url>
    <loc>${escapeMarkup(route.url)}</loc>
    <lastmod>${route.post?.lastmod ?? latestLastmod}</lastmod>
  </url>`)
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join("\n")}
</urlset>
`)
write("robots.txt", `User-agent: *
Allow: /

Sitemap: ${HOME}sitemap.xml
schemamap: ${HOME}schemamap.xml
`)
write("feed.xml", renderFeed(posts))
write("schemamap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:sf="http://schema.org/schemas/schemafeed/0.1">
  <url>
    <loc>${HOME}feed.xml</loc>
    <sf:contentType>structuredData/rss</sf:contentType>
  </url>
</urlset>
`)

const resourceId = `urn:air:${new URL(HOME).hostname}:research`
write(ARD_PATH.slice(1), `${JSON.stringify({
  specVersion: "1.0",
  host: { displayName: SITE_NAME, identifier: HOME, documentationUrl: `${HOME}llms.txt` },
  entries: [
    {
      identifier: `${resourceId}:posts`,
      displayName: `${SITE_NAME} post index`,
      type: "text/plain",
      url: `${HOME}posts/llms.txt`,
      description: "A navigable index of published research in Markdown.",
      representativeQueries: ["Where are the evidence-first UI case studies?", "Which report covers offline agent environments?"],
    },
    {
      identifier: `${resourceId}:feed`,
      displayName: `${SITE_NAME} RSS feed`,
      type: "application/rss+xml",
      url: `${HOME}feed.xml`,
      description: "An RSS 2.0 feed of published research posts.",
      representativeQueries: ["How can I follow new REA Research posts?", "What is the latest report in REA Research?"],
    },
  ],
}, null, 2)}\n`)
const skillName = "read-rea-research"
const skillPath = `/.well-known/agent-skills/${skillName}/SKILL.md`
const skillFile = skillPath.slice(1)
const skill = readFileSync(join(DIST, skillFile), "utf8").replaceAll(DEFAULT_SITE_ORIGIN, () => SITE_ORIGIN)
const description = /^description: (.+)$/m.exec(skill)?.[1]
if (!description) throw new Error(`Missing description in ${skillPath}`)
write(skillFile, skill)
write(".well-known/agent-skills/index.json", `${JSON.stringify({
  skills: [{
    name: skillName,
    type: "skill-md",
    description,
    url: skillPath,
    digest: `sha256:${createHash("sha256").update(skill).digest("hex")}`,
  }],
}, null, 2)}\n`)
console.log(`Generated ${pages.length} HTML pages, ${markdown.size + 1} Markdown files, and discovery files in dist/.`)
