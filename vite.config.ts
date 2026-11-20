import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5179,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react-vendor"
          }
          if (id.includes("node_modules/@ui-sdk/core/")) return "ui-sdk-core"
          if (id.includes("node_modules/@ui-sdk/react/")) return "ui-sdk-react"
          if (id.includes("node_modules/lucide-react/")) return "lucide"
        },
      },
    },
  },
})
