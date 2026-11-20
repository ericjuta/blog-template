import { readdirSync, readFileSync } from "node:fs"
import { extname, join } from "node:path"
import { gzipSync } from "node:zlib"

const MAX_JS_CHUNK_BYTES = 265 * 1024
const MAX_TOTAL_JS_GZIP_BYTES = 230 * 1024
const MAX_CSS_BYTES = 140 * 1024
const assetsDir = join("dist", "assets")
const formatKiB = (bytes) => `${(bytes / 1024).toFixed(2)} KiB`

let entries
try {
  entries = readdirSync(assetsDir, { withFileTypes: true })
} catch (error) {
  console.error(`Cannot read ${assetsDir}: ${error.message}`)
  process.exit(1)
}

let totalJsGzipBytes = 0
let totalCssBytes = 0
const failures = []

for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isFile()) continue

  const extension = extname(entry.name)
  const isJs = extension === ".js" || extension === ".mjs" || extension === ".cjs"
  if (!isJs && extension !== ".css") continue

  const contents = readFileSync(join(assetsDir, entry.name))
  const rawBytes = contents.length
  const gzipBytes = gzipSync(contents).length
  console.log(`${entry.name}: ${formatKiB(rawBytes)} raw, ${formatKiB(gzipBytes)} gzip`)

  if (isJs) {
    totalJsGzipBytes += gzipBytes
    if (rawBytes > MAX_JS_CHUNK_BYTES) {
      failures.push(`${entry.name}: ${formatKiB(rawBytes)} raw exceeds the ${formatKiB(MAX_JS_CHUNK_BYTES)} JS chunk budget`)
    }
  } else {
    totalCssBytes += rawBytes
  }
}

console.log(`Total: ${formatKiB(totalJsGzipBytes)} JS gzip, ${formatKiB(totalCssBytes)} CSS raw`)

if (totalJsGzipBytes > MAX_TOTAL_JS_GZIP_BYTES) {
  failures.push(`Total JS gzip exceeds the ${formatKiB(MAX_TOTAL_JS_GZIP_BYTES)} budget`)
}
if (totalCssBytes > MAX_CSS_BYTES) {
  failures.push(`Total CSS raw exceeds the ${formatKiB(MAX_CSS_BYTES)} budget`)
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exitCode = 1
}
