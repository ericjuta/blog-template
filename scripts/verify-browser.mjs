import assert from "node:assert/strict"
import { readdir, readFile, realpath, stat } from "node:fs/promises"
import { createServer } from "node:http"
import { createRequire } from "node:module"
import { homedir } from "node:os"
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, errors } from "playwright-core"

const DIST = fileURLToPath(new URL("../dist/", import.meta.url))
const HOST = "127.0.0.1"
const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".woff2", "font/woff2"],
  [".json", "application/json"],
  [".xml", "application/xml; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
])
const ROUTES = [
  { path: "/", heading: /Evidence-First Interfaces/i, mobile: true },
  { path: "/research", heading: /Discoveries from Evidence-First Engineering/i, mobile: true },
  { path: "/posts/dx-ball-sound-pan", heading: /DX-Ball 1\.07/i },
  { path: "/posts/notion-clipboard-bridge", heading: /Tracing Notion Desktop/i },
  { path: "/posts/agent-environments", heading: /AgentEnv/i, mobile: true },
  { path: "/design-system", heading: /Component Gallery/i, mobile: true },
  { path: "/does-not-exist", heading: /404: Page not found/i, mobile: true, status: 404 },
]
const DESKTOP = { width: 1365, height: 900 }
const MOBILE = { width: 390, height: 844 }
const FONT_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com"])
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"]

async function isFile(path) {
  return (await stat(path).catch(() => null))?.isFile() ?? false
}

async function resolveChromiumExecutable() {
  for (const path of [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, process.env.CHROME_PATH]) {
    if (path && await isFile(path)) return resolve(path)
  }

  const browsersDir = join(homedir(), ".agent-browser", "browsers")
  const versions = (await readdir(browsersDir, { withFileTypes: true }).catch(() => []))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("chrome-"))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a, "en", { numeric: true }))
  for (const version of versions) {
    const path = join(browsersDir, version, "chrome")
    if (await isFile(path)) return path
  }

  for (const path of [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ]) {
    if (await isFile(path)) return path
  }
  const playwrightPath = chromium.executablePath()
  if (await isFile(playwrightPath)) return playwrightPath
  throw new Error("No Chromium executable found. Install Chromium or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to its executable.")
}

function within(root, path) {
  const local = relative(root, path)
  return local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local)
}

async function findStaticFile(root, path) {
  const file = await realpath(path).catch((error) => {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return null
    throw error
  })
  // Check the resolved path as well, so symlinks cannot expose files outside dist.
  return file && within(root, file) && await isFile(file) ? file : null
}

function createStaticServer(root, notFound) {
  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end()
      return
    }

    let pathname
    try {
      // Decode before resolving so encoded traversal is rejected, not normalized away.
      pathname = decodeURIComponent(request.url.split("?", 1)[0])
    } catch {
      response.writeHead(400).end()
      return
    }
    const requested = resolve(root, `.${pathname}`)
    if (!pathname.startsWith("/") || pathname.includes("\\") || pathname.includes("\0") ||
        pathname.split("/").includes("..") || !within(root, requested)) {
      response.writeHead(403).end()
      return
    }

    try {
      // For extensionless routes, prefer the generated directory index to a literal file.
      const index = extname(pathname) ? null : await findStaticFile(root, join(requested, "index.html"))
      const file = index ?? await findStaticFile(root, requested)
      const body = await readFile(file ?? notFound)
      response.writeHead(file ? 200 : 404, {
        "Content-Type": MIME_TYPES.get(extname(file ?? notFound)) ?? "application/octet-stream",
        "Content-Length": body.length,
      }).end(request.method === "HEAD" ? undefined : body)
    } catch (error) {
      console.error(`Could not serve ${pathname}: ${error.message}`)
      response.writeHead(500).end()
    }
  })
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, HOST, () => {
      server.off("error", reject)
      resolve()
    })
  })
  return `http://${HOST}:${server.address().port}`
}

async function withCheckedPage(browser, origin, options, result, check) {
  const externalRequests = new Set()
  const context = await browser.newContext({
    viewport: options.viewport,
    colorScheme: options.colorScheme,
    serviceWorkers: "block",
  })
  try {
    // Report attempted off-site requests and abort them before they reach the network.
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url())
      if (url.origin === origin || url.protocol === "data:" || url.protocol === "blob:") {
        return route.continue()
      }
      const kind = FONT_HOSTS.has(url.hostname) ? "External font host" : "External request"
      externalRequests.add(`${kind}: ${url.href}`)
      return route.abort("blockedbyclient")
    })
    const page = await context.newPage()
    page.setDefaultTimeout(5_000)
    await page.emulateMedia({ colorScheme: options.colorScheme })
    let ignoredNotFound = false
    page.on("console", (msg) => {
      if (msg.type() !== "error") return
      const { url, lineNumber, columnNumber } = msg.location()
      if (options.expected404 && !ignoredNotFound && url === options.expected404 && lineNumber === 0 && columnNumber === 0 &&
          /^Failed to load resource: the server responded with a status of 404(?: \(Not Found\))?$/.test(msg.text())) {
        ignoredNotFound = true
        return
      }
      result.failures.push(`Console error: ${msg.text()}${url ? ` (${url}:${lineNumber + 1})` : ""}`)
    })
    page.on("pageerror", (error) => {
      result.failures.push(`Uncaught exception: ${error.stack ?? error.message}`)
    })
    await check(page)
  } catch (error) {
    result.failures.push(error.message)
  } finally {
    await context.close()
    result.failures.push(...externalRequests)
  }
}

async function gotoAndSettle(page, url) {
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 15_000 })
  try {
    await page.waitForFunction(() => !document.querySelector(".figure-skeleton"), undefined, { timeout: 3_000 })
  } catch (error) {
    if (!(error instanceof errors.TimeoutError)) throw error
  }
  await page.evaluate(async () => { await document.fonts.ready })
  return response?.status()
}

async function auditRoute(browser, origin, axePath, route, viewport, colorScheme) {
  const url = `${origin}${route.path}`
  const status = route.status ?? 200
  const result = {
    label: `${route.path} · ${viewport.width}×${viewport.height} · ${colorScheme}`,
    failures: [],
    axePasses: 0,
    contrastPassed: false,
  }
  await withCheckedPage(browser, origin, {
    viewport,
    colorScheme,
    expected404: status === 404 ? url : undefined,
  }, result, async (page) => {
    const actualStatus = await gotoAndSettle(page, url)
    if (actualStatus !== status) result.failures.push(`Expected HTTP ${status}, got ${actualStatus}`)

    const { heading, scrollWidth, innerWidth } = await page.evaluate(() => ({
      heading: document.querySelector("h1")?.textContent.trim() ?? "",
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    if (!route.heading.test(heading)) {
      result.failures.push(`Expected h1 to match ${route.heading}, got ${JSON.stringify(heading)}`)
    }
    if (scrollWidth > innerWidth + 1) {
      result.failures.push(`Horizontal overflow: scrollWidth=${scrollWidth}px, innerWidth=${innerWidth}px`)
    }

    await page.addScriptTag({ path: axePath })
    const axe = await page.evaluate((tags) => window.axe.run(document, {
      runOnly: { type: "tag", values: tags },
    }), WCAG_TAGS)
    result.axePasses = axe.passes.length
    const contrastViolation = axe.violations.some(({ id }) => id === "color-contrast")
    result.contrastPassed = !contrastViolation && axe.passes.some(({ id }) => id === "color-contrast")
    if (!result.contrastPassed && !contrastViolation) {
      result.failures.push("axe did not report a computed color-contrast pass or violation")
    }
    for (const { id, impact, nodes } of axe.violations) {
      if (impact !== "critical" && impact !== "serious" && id !== "color-contrast") continue
      for (const { target, failureSummary } of nodes) {
        result.failures.push(`axe ${id} (${impact}) — ${JSON.stringify(target)}\n${failureSummary}`)
      }
    }
  })
  return result
}

const INTERACTIVE_CHECKS = [
  ["Self-hosted Geist font", async (page) => {
    assert.ok(await page.evaluate(() => Boolean(document.querySelector('link[rel="preload"][as="font"]'))),
      "Expected a font preload on /")
    const families = await page.evaluate(() => Array.from(document.fonts, ({ family }) => family))
    // Fontsource registers the Geist variable face as "Geist Variable".
    assert.ok(families.some((family) => /^Geist(?: Variable)?$/.test(family.replace(/["']/g, ""))),
      `Expected Geist in document.fonts, got: ${[...new Set(families)].join(", ") || "none"}`)
  }],
  ["Header theme cycles through light, dark, and system", async (page) => {
    const toggle = page.getByRole("banner").getByRole("button", { name: /theme/i })
    const readTheme = () => page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      background: getComputedStyle(document.body).backgroundColor,
    }))
    const light = "rgb(255, 255, 255)"
    const dark = "rgb(10, 10, 10)"

    assert.deepEqual(await readTheme(), { theme: undefined, background: light }, "Expected the initial system light theme")
    // Use a dark OS preference so the explicit light override must actually change the palette.
    await page.emulateMedia({ colorScheme: "dark" })
    assert.deepEqual(await readTheme(), { theme: undefined, background: dark }, "System theme should follow the OS")
    await toggle.click()
    assert.deepEqual(await readTheme(), { theme: "light", background: light })
    await page.emulateMedia({ colorScheme: "light" })
    await toggle.click()
    assert.deepEqual(await readTheme(), { theme: "dark", background: dark })
    await toggle.click()
    assert.deepEqual(await readTheme(), { theme: undefined, background: light }, "System mode must clear data-theme")
  }],
  ["DX-Ball EvidenceStepper ArrowRight", async (page) => {
    const steps = page.locator('[aria-label="DX-Ball reconstruction evidence steps"]').getByRole("button")
    const first = steps.nth(0)
    const second = steps.nth(1)
    assert.equal(await first.getAttribute("aria-current"), "step", "First DX-Ball step should start current")
    await first.focus()
    await page.keyboard.press("ArrowRight")
    assert.equal(await second.getAttribute("aria-current"), "step", "Second DX-Ball step should become current")
    assert.ok(await second.evaluate((button) => button === document.activeElement), "Second DX-Ball step should have focus")
  }],
  ["Agent Console snapshot controls and Escape", async (page) => {
    await page.getByRole("button", { name: "Agent Console", exact: true }).click()
    const dialog = page.locator('[role="dialog"]')
    await dialog.waitFor({ state: "visible" })
    await dialog.getByRole("button", { name: "Refresh snapshot", exact: true }).waitFor({ state: "visible" })
    await dialog.getByText(/^Discovered SDK Components \(\d+\)$/).waitFor({ state: "visible" })
    await page.keyboard.press("Escape")
    await dialog.waitFor({ state: "hidden" })
  }],
  ["History API navigation, Back and Forward", async (page) => {
    const research = ROUTES.find(({ path }) => path === "/research")
    const agentEnv = ROUTES.find(({ path }) => path === "/posts/agent-environments")
    // A real document navigation would lose this marker, even at the right URL.
    await page.evaluate(() => { window.__verifyBrowserHistory = true })
    const verifyRoute = async ({ path, heading }) => {
      await page.waitForURL((url) => url.pathname === path)
      await page.getByRole("heading", { level: 1, name: heading }).waitFor({ state: "visible" })
      assert.equal(await page.evaluate(() => window.__verifyBrowserHistory), true, `Unexpected document reload at ${path}`)
    }

    await page.getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "All Research", exact: true }).click()
    await verifyRoute(research)
    await page.getByRole("article").filter({ has: page.getByRole("heading", { name: agentEnv.heading }) })
      .getByRole("link", { name: /Open interactive post/i }).click()
    await verifyRoute(agentEnv)
    await page.goBack()
    await verifyRoute(research)
    await page.goForward()
    await verifyRoute(agentEnv)
  }],
  ["Print media hides the site header", async (page) => {
    await page.emulateMedia({ media: "print" })
    assert.equal(await page.locator(".site-header").evaluate((el) => getComputedStyle(el).display), "none")
  }],
]

function summarize(audits, interactive) {
  const passed = (results) => `${results.filter(({ failures }) => !failures.length).length}/${results.length}`
  console.table([
    { Check: "Route / viewport / theme audits", Passed: passed(audits) },
    { Check: "Axe rule passes (summed across audits)", Passed: audits.reduce((sum, result) => sum + result.axePasses, 0) },
    { Check: "Axe computed color-contrast", Passed: `${audits.filter(({ contrastPassed }) => contrastPassed).length}/${audits.length}` },
    { Check: "Interactive checks", Passed: passed(interactive) },
  ])
  for (const { label, failures } of [...audits, ...interactive]) {
    if (!failures.length) continue
    process.exitCode = 1
    console.error(`\nFAIL ${label}`)
    for (const failure of failures) console.error(`  - ${failure.replaceAll("\n", "\n    ")}`)
  }
}

async function main() {
  const executablePath = await resolveChromiumExecutable()
  const axePath = createRequire(import.meta.url).resolve("axe-core")
  const root = await realpath(DIST).catch(() => null)
  const notFound = root && await findStaticFile(root, join(root, "404.html"))
  if (!notFound || !await findStaticFile(root, join(root, "index.html"))) {
    throw new Error("Missing dist/index.html or dist/404.html. Run bun run build first.")
  }

  const server = createStaticServer(root, notFound)
  let browser
  try {
    const origin = await listen(server)
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const audits = []
    for (const viewport of [DESKTOP, MOBILE]) {
      for (const colorScheme of ["light", "dark"]) {
        for (const route of ROUTES) {
          if (viewport === MOBILE && !route.mobile) continue
          audits.push(await auditRoute(browser, origin, axePath, route, viewport, colorScheme))
        }
      }
    }

    const interactive = []
    for (const [label, check] of INTERACTIVE_CHECKS) {
      const result = { label, failures: [] }
      await withCheckedPage(browser, origin, { viewport: DESKTOP, colorScheme: "light" }, result, async (page) => {
        assert.equal(await gotoAndSettle(page, `${origin}/`), 200, "Expected HTTP 200 for /")
        await check(page)
      })
      interactive.push(result)
    }
    summarize(audits, interactive)
  } finally {
    try {
      await browser?.close()
    } finally {
      if (server.listening) {
        await new Promise((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve())
        })
      }
    }
  }
}

main().catch((error) => {
  console.error(`Browser verification failed: ${error.message}`)
  process.exitCode = 1
})
