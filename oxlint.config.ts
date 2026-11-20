import cloudflareConfig from "@cloudflare/oxlint-config"
import { defineConfig } from "oxlint"

export default defineConfig({
  ...cloudflareConfig,
  ignorePatterns: ["dist/**", "node_modules/**", "scripts/**"],
  rules: {
    ...cloudflareConfig.rules,
    "typescript/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
  },
})
