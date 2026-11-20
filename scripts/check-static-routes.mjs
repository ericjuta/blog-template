import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { JSDOM } from "jsdom"
import { SITE_NAME, SITE_ORIGIN } from "../src/lib/site.ts"

const read = (path) => readFileSync(join("dist", path), "utf8")
const origin = new URL(SITE_ORIGIN)
const parse = (body, contentType = "text/html") => new JSDOM(body, { contentType }).window.document
const localPath = (url) => {
  const target = new URL(url, origin)
  assert.equal(target.origin, origin.origin, `${url} is not a same-site resource`)
  return target.pathname.slice(1)
}

const sitemap = parse(read("sitemap.xml"), "text/xml")
const urls = sitemap.querySelectorAll("url")
assert.ok(urls.length > 0, "The sitemap must contain URLs")
for (const entry of urls) {
  const url = entry.querySelector("loc")?.textContent
  assert.ok(url, "Sitemap entries must include a URL")
  assert.match(entry.querySelector("lastmod")?.textContent ?? "", /^\d{4}-\d{2}-\d{2}$/, `Invalid lastmod for ${url}`)
  const path = localPath(url)
  const html = parse(read(path ? `${path}/index.html` : "index.html"))
  assert.equal(html.querySelector('link[rel="canonical"]').href, url)
  assert.equal(html.querySelector('meta[name="rea-site-origin"]').content, SITE_ORIGIN)
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    assert.equal(html.querySelector(selector).content, `${SITE_ORIGIN}/og-image.png`)
  }
  const main = html.querySelector("#root main")
  assert.ok(main.textContent.trim().length >= 500, `${path || "/"} needs meaningful raw HTML`)
  const heading = main.querySelector("h1").textContent.trim()
  assert.equal(main.querySelectorAll("h1").length, 1)
  assert.equal(html.querySelectorAll('script:not([src]):not([type="application/ld+json"])').length, 0)

  const alternate = html.querySelector('link[rel="alternate"][type="text/markdown"]')
  const markdownPath = path ? `${path}.md` : "index.md"
  assert.equal(localPath(alternate.href), markdownPath)
  const markdown = read(markdownPath)
  const [frontmatter, body] = markdown.slice(4).split("\n---\n", 2)
  assert.ok(markdown.startsWith("---\n"))
  assert.ok(frontmatter.includes(`title: ${JSON.stringify(heading)}`))
  assert.ok(frontmatter.includes(`canonical: ${JSON.stringify(url)}`))
  assert.equal(body.trimStart().split("\n", 1)[0], `# ${heading}`)
  assert.ok(markdown.length >= 500)
  assert.ok(markdown.includes(`[HTML version](${url})`))
  if (path.startsWith("posts/")) assert.ok(markdown.includes("## Notes & References"))

  const graph = JSON.parse(html.querySelector('script[type="application/ld+json"]').textContent)["@graph"]
  const publisher = graph.find((node) => node["@type"] === "Organization")
  const website = graph.find((node) => node["@type"] === "WebSite")
  assert.equal(website.publisher["@id"], publisher["@id"])
  if (path) assert.ok(graph.some((node) => node["@type"] === "BreadcrumbList"))
}

for (const path of ["llms.txt", "posts/llms.txt", "design-system/llms.txt"]) {
  const index = read(path)
  assert.match(index, /^# /)
  for (const [, url] of index.matchAll(/\]\((https?:[^)]+)\)/g)) {
    const path = localPath(url)
    const file = path === "design-system" ? `${path}/index.html` : path
    assert.ok(read(file).length > 100)
  }
}

const robots = read("robots.txt").split("\n")
assert.ok(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`))
assert.ok(robots.includes(`schemamap: ${SITE_ORIGIN}/schemamap.xml`))
const schemaFeed = parse(read("schemamap.xml"), "text/xml").querySelector("loc").textContent
assert.equal(parse(read(localPath(schemaFeed)), "text/xml").documentElement.tagName, "rss")
for (const { url } of JSON.parse(read(".well-known/ard.json")).entries) {
  assert.ok(read(localPath(url)).length > 100)
}

for (const { url, digest, name } of JSON.parse(read(".well-known/agent-skills/index.json")).skills) {
  const skill = read(localPath(url))
  assert.ok(skill.startsWith(`---\nname: ${name}\n`))
  if (name === "read-rea-research") assert.ok(skill.includes(`](${SITE_ORIGIN}/posts/llms.txt)`))
  assert.equal(digest, `sha256:${createHash("sha256").update(skill).digest("hex")}`)
}

const notFound = parse(read("404.html"))
assert.match(notFound.querySelector("#root h1").textContent, /404/)
assert.equal(notFound.querySelector('meta[name="robots"]').content, "noindex")
const notFoundMarkdown = read("404.md")
assert.ok(notFoundMarkdown.startsWith("---\n"))
const [frontmatter, body] = notFoundMarkdown.slice(4).split("\n---\n", 2)
const metadata = frontmatter.split("\n")
assert.ok(metadata.includes(`title: ${JSON.stringify(`404: Page Not Found | ${SITE_NAME}`)}`))
assert.ok(metadata.includes("status: 404"))
assert.ok(metadata.includes(`canonical: ${JSON.stringify(`${SITE_ORIGIN}/404`)}`))
assert.match(body, /^# 404\b/m)
for (const path of ["/", "/research", "/llms.txt", "/posts/llms.txt", "/feed.xml"]) {
  assert.ok(body.includes(`](${SITE_ORIGIN}${path})`), `404.md must link to ${path}`)
}
console.log("Static route, Markdown and discovery checks passed.")
