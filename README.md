# Interactive Research Blog Template

A static-first, agent-friendly technical blog template built with React 19, Vite 6, TypeScript, [Vercel UI SDK](https://ui-sdk.dev/) headless primitives, and Cloudflare Pages Functions.

Ships with sample interactive articles, paragraph-anchored Tufte sidenotes, an interactive component gallery (`/design-system`), an in-page Agent Console + WebMCP registration, light/dark/system theme switching, build-time prerendered HTML/Markdown/OG/discovery generation, and real-browser Playwright + `axe-core` WCAG AA verification.

## Features

- **Interactive editorial layout**: Sticky table of contents with scroll tracking, reading progress bar, paragraph-anchored desktop sidenotes with mobile popovers, and lazy-loaded interactive figures wrapped in error boundaries.
- **Headless primitives + agent bridge**: Uses `@ui-sdk/core` and `@ui-sdk/react` (`Tabs`, `SegmentedControl`, `Slider`, `Switch`, `Popover`, `Collapsible`, `Drawer`, `Waterfall`, plus a custom `EvidenceStepper` primitive) and exposes read-only WebMCP tools (`find_research_posts`, `read_research_post`, `list_research_pages`).
- **Static SEO & agent discovery at build time**: `scripts/generate-static-routes.mjs` prerenders per-route HTML with canonical URLs, JSON-LD (`BlogPosting`, `WebSite`, `Organization`, `BreadcrumbList`), Markdown mirrors (`*.md`), `sitemap.xml`, `robots.txt`, `feed.xml`, `schemamap.xml`, `llms.txt`, `llms-full.txt`, `/.well-known/ard.json`, `/.well-known/agent-skills/index.json`, `apple-touch-icon.png`, and zero-dependency per-article 1200x630 OG PNGs (`/og/<slug>.png`).
- **Content negotiation for Markdown**: `functions/_middleware.ts` serves Markdown (`text/markdown; charset=utf-8`) on Cloudflare Pages when a client requests `Accept: text/markdown` or uses an AI reader User-Agent, sets `Vary: Accept, User-Agent`, includes `x-markdown-tokens`, and returns real HTTP 404 responses (`404.html` / `404.md` with `noindex`).
- **Accessible & CSP-strict**: Self-hosted Geist & Geist Mono variable fonts with Latin WOFF2 preload, CSP-safe external `public/theme-init.js` (no inline scripts), semantic light/dark tokens, and print stylesheet.
- **Full verification stack**: Oxlint (`@cloudflare/oxlint-config`), TypeScript (`tsc -b`), Vitest + Testing Library + `axe-core`, static route/discovery/PNG integrity assertions, JS/CSS bundle budgets, and a headless Chromium Playwright + `axe-core` gate across 24 route/viewport/theme combinations and 6 interactive flows.

## Quick start

Prerequisites: [Bun](https://bun.sh/) (`1.4.4+`) and Node.js (`22.18+` or `24+`).

```bash
bun install --frozen-lockfile
bun run dev
```

Open `http://127.0.0.1:5179`.

## Commands

| Script | What it runs |
| --- | --- |
| `bun run dev` | Local Vite dev server on `127.0.0.1:5179` |
| `bun run build` | `tsc -b`, Vite production build, and static route/Markdown/OG/discovery generation into `dist/` |
| `bun run check` | `lint` -> `typecheck` -> `test` -> `build` -> `check:static` -> `check:bundle` |
| `bun run check:browser` | Serves `dist/` locally and runs Playwright + `axe-core` WCAG AA audits (desktop/mobile, light/dark) and interactive flows |

`bun run check:browser` automatically discovers `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, `CHROME_PATH`, `/usr/bin/google-chrome`, `/usr/bin/chromium`, or Playwright's installed Chromium.

## Customizing for your site

1. **Set your site origin and branding** in `src/lib/site.ts`:
   - Change `DEFAULT_SITE_ORIGIN` (or pass `SITE_ORIGIN=https://your-domain.com` at build time — the generator rewrites canonical URLs, OG image URLs, `sitemap.xml`, `robots.txt`, `llms.txt`, `feed.xml`, `SKILL.md` + its SHA-256 digest, and the OG card footer automatically).
   - Update `SITE_NAME`, `SITE_DESCRIPTION`, and `PUBLISHER_NAME`.
2. **Update static metadata defaults** in `index.html`, `public/manifest.webmanifest`, `public/favicon.svg`, `public/og-image.png`, and `public/.well-known/agent-skills/read-rea-research/SKILL.md`.
3. **Replace the sample posts and interactive figures** in `src/data/blog-data.ts`, `src/App.tsx`, and `src/components/`.
4. **Optional client error reporting**: Set `VITE_ERROR_REPORT_URL` at build time to POST captured React boundary / `window.onerror` / `unhandledrejection` records via `navigator.sendBeacon` (leave unset for in-memory buffering only).

## Deployment (Cloudflare Pages)

Connect the repository in Cloudflare Pages:

- **Build command**: `bun install --frozen-lockfile && bun run check`
- **Build output directory**: `dist`
- **Environment variable** (optional): `SITE_ORIGIN=https://your-domain.com`

`functions/_middleware.ts` and `public/_headers` are picked up automatically by Cloudflare Pages.

> Note: This template works as a plain static site on any static host (Vercel, Netlify, GitHub Pages, S3/CloudFront), too — `dist/` contains all prerendered HTML, `*.md`, `404.html`, and discovery files. Only live `Accept: text/markdown` negotiation depends on `functions/_middleware.ts`.

## License & third-party notices

Licensed under the [MIT License](LICENSE).

Runtime/bundled dependencies include:

- `@ui-sdk/core`, `@ui-sdk/react` (Apache-2.0)
- `@fontsource-variable/geist`, `@fontsource-variable/geist-mono` (OFL-1.1)
- `react`, `react-dom` (MIT)
- `lucide-react` (ISC)

Dev/test dependencies include `axe-core` (MPL-2.0, dev/test only — not bundled into `dist/`), `playwright-core` (Apache-2.0), `@cloudflare/oxlint-config` (Apache-2.0), and `caniuse-lite` (CC-BY-4.0, build/tooling only).
