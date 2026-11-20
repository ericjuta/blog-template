import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5179,
    strictPort: true,
    allowedHosts: ["codex-lb.tail497567.ts.net"],
  },
})
