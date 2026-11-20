export const DEFAULT_SITE_ORIGIN = "https://askgina-blog.pages.dev"
export const SITE_NAME = "REA Research"
export const SITE_DESCRIPTION =
  "Interactive technical reports combining Reverse Engineer Anything (REA) evidence provenance with Vercel UI SDK headless primitives and live agent bridges."

function readRuntimeOrigin(): string | undefined {
  const runtime: unknown = globalThis
  if (typeof runtime !== "object" || runtime === null || !("process" in runtime)) {return undefined}

  const runtimeProcess = runtime.process
  if (typeof runtimeProcess !== "object" || runtimeProcess === null || !("env" in runtimeProcess)) {
    return undefined
  }

  const env = runtimeProcess.env
  if (typeof env !== "object" || env === null) {return undefined}
  if ("SITE_ORIGIN" in env && typeof env.SITE_ORIGIN === "string") {return env.SITE_ORIGIN}
  if ("VITE_SITE_ORIGIN" in env && typeof env.VITE_SITE_ORIGIN === "string") {return env.VITE_SITE_ORIGIN}
  return undefined
}

// Generated pages carry the build's origin so client-side metadata stays in sync
// even when only the server-side SITE_ORIGIN variable was set at build time.
const pageOrigin = typeof document === "undefined"
  ? undefined
  : document.querySelector('meta[name="rea-site-origin"]')?.getAttribute("content")
const viteOrigin: unknown = import.meta.env?.VITE_SITE_ORIGIN
const origin = pageOrigin ?? readRuntimeOrigin() ?? (typeof viteOrigin === "string" ? viteOrigin : undefined)

export const SITE_ORIGIN = origin?.trim().replace(/\/+$/, "") || DEFAULT_SITE_ORIGIN
