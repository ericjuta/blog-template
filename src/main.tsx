import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "@ui-sdk/core/web.css"
import "./styles.css"
import { App } from "./App"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { installGlobalErrorHandlers } from "./lib/error-reporter"
import { registerResearchTool } from "./lib/research-webmcp"

installGlobalErrorHandlers()

const unregisterResearchTool = registerResearchTool()
if (import.meta.hot && unregisterResearchTool) {
  import.meta.hot.dispose(unregisterResearchTool)
}

const rootEl = document.getElementById("root")
if (!rootEl) {
  throw new Error("Root element #root not found")
}

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary scope="app" label="Application">
      <App />
    </ErrorBoundary>
  </StrictMode>
)
