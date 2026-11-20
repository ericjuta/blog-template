import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { JSDOM } from "jsdom"

const read = (path) => readFileSync(join("dist", path), "utf8")
const origin = new URL("https://askgina-blog.pages.dev")
const parse = (body, contentType = "text/html") => new JSDOM(body, { contentType }).window.document
const localPath = (url) => {
  const target = new URL(url, origin)
  assert.equal(target.origin, origin.origin, `${url} is not a same-site resource`)
  return target.pathname.slice(1)
}

const sitemap = parse(read("sitemap.xml"), "text/xml")
for (const url of sitemap.querySelectorAll("loc")) {
  const path = localPath(url.textContent)
  const html = parse(read(path ? `${path}/index.html` : "index.html"))
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
  assert.ok(frontmatter.includes(`canonical: ${JSON.stringify(url.textContent)}`))
  assert.equal(body.trimStart().split("\n", 1)[0], `# ${heading}`)
  assert.ok(markdown.length >= 500)
  assert.ok(markdown.includes(`[HTML version](${url.textContent})`))
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

const schemaMap = localPath(read("robots.txt").match(/^schemamap:\s*(\S+)/mi)[1])
const schemaFeed = parse(read(schemaMap), "text/xml").querySelector("loc").textContent
assert.equal(parse(read(localPath(schemaFeed)), "text/xml").documentElement.tagName, "rss")
for (const { url } of JSON.parse(read(".well-known/ard.json")).entries) {
  assert.ok(read(localPath(url)).length > 100)
}

for (const { url, digest, name } of JSON.parse(read(".well-known/agent-skills/index.json")).skills) {
  const skill = read(localPath(url))
  assert.ok(skill.startsWith(`---\nname: ${name}\n`))
  assert.equal(digest, `sha256:${createHash("sha256").update(skill).digest("hex")}`)
}

const notFound = parse(read("404.html"))
assert.match(notFound.querySelector("#root h1").textContent, /404/)
assert.equal(notFound.querySelector('meta[name="robots"]').content, "noindex")
console.log("Static route, Markdown and discovery checks passed.")
