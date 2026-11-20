import { lazy, Suspense, useEffect, useState } from "react"
import type { MouseEvent, ReactNode } from "react"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react/collapsible"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import {
  BLOG_POSTS,
  POST_TOCS,
  REFERENCES,
  REPORT_TOC,
} from "./data/blog-data"
import type { PostCategory, PostSlug } from "./data/blog-data"
import { Sidenote } from "./components/Citation"
import { CoverArtwork } from "./components/CoverArtwork"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { getBlogAgent } from "./lib/blog-agent"
import { routeToPath, useAppRoute } from "./lib/router"
import type { AppRoute } from "./lib/router"

const DesignSystemGallery = lazy(() =>
  import("./components/DesignSystemGallery").then((module) => ({ default: module.DesignSystemGallery }))
)
const AgentConsoleDrawer = lazy(() =>
  import("./components/AgentConsoleDrawer").then((module) => ({ default: module.AgentConsoleDrawer }))
)
const DxBallFigure = lazy(() =>
  import("./components/DxBallFigure").then((module) => ({ default: module.DxBallFigure }))
)
const BenchmarkFigure = lazy(() =>
  import("./components/BenchmarkFigure").then((module) => ({ default: module.BenchmarkFigure }))
)
const TargetMatrixFigure = lazy(() =>
  import("./components/TargetMatrixFigure").then((module) => ({ default: module.TargetMatrixFigure }))
)
const NotionIpcFigure = lazy(() =>
  import("./components/NotionIpcFigure").then((module) => ({ default: module.NotionIpcFigure }))
)
const AgentEnvFigure = lazy(() =>
  import("./components/AgentEnvFigure").then((module) => ({ default: module.AgentEnvFigure }))
)

type CategoryFilter = "All" | PostCategory

function LazyFigure({
  title,
  slug,
  children,
}: {
  title: string
  slug: PostSlug
  children: ReactNode
}) {
  return (
    <ErrorBoundary scope="figure" label={title} resetKey={slug}>
      <Suspense
        fallback={
          <div className="figure-skeleton" role="status" aria-live="polite">
            Loading interactive figure...
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export function App({ initialRoute }: { initialRoute?: AppRoute }) {
  const { route, navigate } = useAppRoute(initialRoute)
  const [category, setCategory] = useState<CategoryFilter>("All")
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [activeToc, setActiveToc] = useState<string>(REPORT_TOC[0]?.id ?? "dx-ball-trace")
  const [readProgress, setReadProgress] = useState(0)

  useEffect(() => {
    getBlogAgent()
  }, [])

  const featured = BLOG_POSTS[0]
  const filteredPosts = BLOG_POSTS.filter((p) =>
    category === "All" ? true : p.category === category
  )

  const currentPost = route.kind === "post"
    ? BLOG_POSTS.find((p) => p.slug === route.slug) ?? featured
    : featured
  const currentToc = POST_TOCS[currentPost.slug] ?? REPORT_TOC

  useEffect(() => {
    if (route.kind !== "post") {
      return
    }

    const handleScroll = () => {
      const docEl = document.documentElement
      const scrollable = Math.max(1, docEl.scrollHeight - window.innerHeight)
      const pct = Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100))
      setReadProgress(pct)

      const offset = 120
      let currentId = currentToc[0]?.id ?? ""
      for (const item of currentToc) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= offset) {
          currentId = item.id
        }
      }
      if (currentId) {
        setActiveToc(currentId)
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [route.kind, currentToc])

  const routeLink = (destination: AppRoute) => ({
    href: routeToPath(destination),
    onClick(event: MouseEvent<HTMLAnchorElement>) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {return}
      event.preventDefault()
      navigate(destination)
    },
  })

  return (
    <div>
      <a href="#top" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <a className="brand" {...routeLink({ kind: "index" })}>
            <span className="brand-mark">REA</span>
            <span>REA Research</span>
          </a>

          <nav className="header-nav" aria-label="Primary navigation">
            <a
              className={`btn btn-sm ${route.kind === "index" ? "btn-primary" : "btn-ghost"}`}
              {...routeLink({ kind: "index" })}
            >
              All Research
            </a>
            <a
              className={`btn btn-sm ${
                route.kind === "post" && route.slug === "evidence-first-ui" ? "btn-primary" : "btn-ghost"
              }`}
              {...routeLink({ kind: "post", slug: "evidence-first-ui" })}
            >
              Technical Report
            </a>
            <a
              className={`btn btn-sm ${
                route.kind === "design-system" ? "btn-primary" : "btn-ghost"
              }`}
              {...routeLink({ kind: "design-system" })}
            >
              Design System
            </a>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setConsoleOpen(true)}
            >
              Agent Console
            </button>
          </nav>
        </div>
        {route.kind === "post" && (
          <div
            className="reading-progress-track"
            role="progressbar"
            aria-label="Reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(readProgress)}
          >
            <div
              className="reading-progress-fill"
              style={{ width: `${readProgress}%` }}
            />
          </div>
        )}
      </header>

      <main id="top">
        {route.kind === "not-found" ? (
          <div className="error-boundary-app">
            <div className="error-boundary-card">
              <h1>404: Page not found</h1>
              <p style={{ overflowWrap: "anywhere" }}>
                The requested page could not be found
                {route.pathname ? <>: <code>{route.pathname}</code></> : "."}
              </p>
              <div className="error-boundary-actions">
                <a
                  className="btn btn-primary"
                  {...routeLink({ kind: "index" })}
                >
                  All Research
                </a>
                <a
                  className="btn"
                  {...routeLink({ kind: "post", slug: "evidence-first-ui" })}
                >
                  Technical Report
                </a>
              </div>
            </div>
          </div>
        ) : route.kind === "design-system" ? (
          <ErrorBoundary scope="app" resetKey="design-system">
            <Suspense
              fallback={
                <div className="figure-skeleton" role="status">
                  Loading component gallery...
                </div>
              }
            >
              <DesignSystemGallery onOpenConsole={() => setConsoleOpen(true)} />
            </Suspense>
          </ErrorBoundary>
        ) : route.kind === "index" ? (
          <div className="index-shell">
            <p className="index-eyebrow">Research &amp; Releases · REA + Vercel UI SDK</p>
            <h1 className="index-title">Discoveries from Evidence-First Engineering</h1>
            <p className="index-subtitle">
              Interactive technical reports combining Reverse Engineer Anything (REA)
              evidence provenance with Vercel UI SDK headless primitives and live agent
              bridges.
            </p>

            <article className="featured-card">
              <div className="cover-frame">
                <CoverArtwork kind={featured.artwork} />
              </div>
              <div>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span className="pill-badge">{featured.category}</span>
                  <span className="pill-badge pill-badge-neutral">{featured.date}</span>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "2.1rem",
                    fontWeight: 400,
                    lineHeight: 1.12,
                    margin: "0 0 0.75rem",
                    color: "var(--ink)",
                  }}
                >
                  {featured.title}
                </h2>
                <p style={{ color: "var(--ink-secondary)", margin: "0 0 1.25rem" }}>
                  {featured.subtitle}
                </p>
                <a
                  className="btn btn-primary"
                  {...routeLink({ kind: "post", slug: featured.slug })}
                >
                  Read interactive report →
                </a>
              </div>
            </article>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.75rem",
                  fontWeight: 400,
                  margin: 0,
                }}
              >
                Archive
              </h2>

              <SegmentedControl
                aria-label="Filter research posts by category"
                value={category}
                onValueChange={(value) => {
                  if (value !== null) {
                    setCategory(value)
                  }
                }}
              >
                <SegmentedControlIndicator />
                <SegmentedControlItem value="All">All</SegmentedControlItem>
                <SegmentedControlItem value="Technical report">Technical report</SegmentedControlItem>
                <SegmentedControlItem value="Case study">Case study</SegmentedControlItem>
                <SegmentedControlItem value="Research">Research</SegmentedControlItem>
              </SegmentedControl>
            </div>

            <div className="post-grid">
              {filteredPosts.map((post) => (
                <article key={post.slug} className="post-card">
                  <CoverArtwork kind={post.artwork} compact />
                  <div className="post-card-body">
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span className="pill-badge">{post.category}</span>
                      <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                        {post.date} · {post.readTime}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "1.5rem",
                        fontWeight: 400,
                        lineHeight: 1.18,
                        margin: "0.25rem 0",
                      }}
                    >
                      {post.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--ink-secondary)",
                        margin: 0,
                        flex: 1,
                      }}
                    >
                      {post.subtitle}
                    </p>
                    <div style={{ marginTop: "0.75rem" }}>
                      <a
                        className="btn btn-sm"
                        {...routeLink({ kind: "post", slug: post.slug })}
                      >
                        Open interactive post →
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="article-shell">
            <aside className="toc-rail" aria-label="Table of contents">
              <p className="toc-heading">Contents</p>
              <ul className="toc-list">
                {currentToc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="toc-link"
                      data-active={activeToc === item.id ? "true" : "false"}
                      onClick={() => setActiveToc(item.id)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            <article className="article-column">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <a
                  className="btn btn-sm btn-ghost"
                  {...routeLink({ kind: "index" })}
                >
                  ← All research
                </a>
                <span className="pill-badge">{currentPost.category}</span>
              </div>

              <h1 className="article-title">{currentPost.title}</h1>
              <p className="article-dek">{currentPost.subtitle}</p>

              <div className="article-meta">
                <span>{currentPost.date}</span>
                <span>·</span>
                <span>{currentPost.readTime}</span>
                <span>·</span>
                <span>Built with @ui-sdk/core + @ui-sdk/react</span>
              </div>

              <div className="cover-frame">
                <CoverArtwork kind={currentPost.artwork} />
              </div>

              {currentPost.slug === "evidence-first-ui" && (
                <>
                  <div className="abstract-box">
                    <strong>Abstract.</strong> Reverse engineering produces graphs of
                    disassembly, memory reads, IPC hops, and residual unknowns. Static blog
                    prose flattens that structure. By pairing REA’s evidence-backed analysis
                    model
                    <Sidenote
                      num={1}
                      label="Evidence model"
                      note="REA records every tool observation as an immutable Evidence record and tracks unresolved gaps as explicit residual unknowns rather than silent assumptions."
                      refNum={2}
                    />{" "}
                    with Vercel UI SDK’s accessible, agent-addressable primitives
                    <Sidenote
                      num={2}
                      label="Headless + Agent"
                      note="@ui-sdk/core separates focus, keyboard, and ARIA state from styling, and registers every control with createAgent() so agents drive the same UI as humans."
                      refNum={1}
                    />, every figure in this report becomes an inspectable instrument for
                    both human readers and coding agents.
                  </div>

                  <section id="dx-ball-trace" className="article-section">
                    <h2>Case I: DX-Ball Sound-Panning Reconstruction</h2>
                    <p>
                      In the DX-Ball showcase
                      <Sidenote
                        num={3}
                        label="Showcase scope"
                        note="DX-Ball 1.07 checkpoint, 7 October 2026 (REA 4.1.0): 3,205 oracle comparisons checked return values. A separate VC4.0 replay matched 63 compiled bytes."
                        refNum={3}
                      />, REA traces the x86 DirectSound pan routine at{" "}
                      <code>0x00406400</code>. At <code>0x406409</code>,{" "}
                      <code>MOV EAX, [EBP+0x8]</code> loads the horizontal coordinate. The routine
                      then multiplies by <code>1.5625</code>, subtracts <code>500.0</code>,
                      applies the pan scale, and truncates via <code>__ftol</code>. Step through
                      the assembly and probe the reconstructed pan formula below. The browser
                      runs the formula in JavaScript, not the original x86 binary.
                    </p>
                    <LazyFigure title="DX-Ball Sound-Panning" slug={currentPost.slug}>
                      <DxBallFigure />
                    </LazyFigure>
                  </section>

                  <section id="agent-bridge" className="article-section">
                    <h2>Why Headless + Agent-Ready Matters</h2>
                    <p>
                      Vercel UI SDK separates interaction state, roving focus, and ARIA
                      semantics from visual styling
                      <Sidenote
                        num={4}
                        label="Benchmark caveat"
                        note="Vercel Labs reports three-run medians for one project settings task. The benchmark compares the agent bridge with browser tools that read the accessibility tree and then click or type."
                        refNum={1}
                      />. Because every control registers with <code>createAgent()</code>, an
                      agent can inspect and drive the same figures a human reader uses. The
                      published benchmark below measures the bridge on a separate task, not on
                      this blog or on REA investigations.
                    </p>
                    <LazyFigure title="Agent Bridge Benchmarks" slug={currentPost.slug}>
                      <BenchmarkFigure />
                    </LazyFigure>

                    <Collapsible className="collapsible-box">
                      <CollapsibleTrigger className="collapsible-trigger">
                        <span>Methodology note: 3-run median benchmark details</span>
                      </CollapsibleTrigger>
                      <CollapsiblePanel>
                        <div className="collapsible-panel-inner">
                          Vercel Labs used Sonnet through Claude Code for the same project
                          settings task across React, Vue, and Svelte. The chart uses the
                          published three-run medians from <code>vercel-labs/ui</code> (
                          <code>benchmarks/agent</code>). To try the bridge on this page, open
                          the <strong>Agent Console</strong> in the top bar.
                        </div>
                      </CollapsiblePanel>
                    </Collapsible>
                  </section>

                  <section id="notion-ipc" className="article-section">
                    <h2>Case II: Notion Desktop 7.6.1 Clipboard IPC Bridge</h2>
                    <p>
                      Static JavaScript analysis in REA does not require a native disassembler.
                      Inspecting Notion Desktop’s <code>app.asar</code>
                      <Sidenote
                        num={5}
                        label="Provenance split"
                        note="REA 4.1.0 located the exposed API and renderer IPC call in the desktop preload. The clipboard format comes from separate cached web-asset probes."
                        refNum={4}
                      />{" "}
                      maps the full trust boundary from renderer preload wrappers to the
                      sender-checked <code>ipcMain.handle</code> clipboard sink.
                    </p>
                    <LazyFigure title="Notion Clipboard IPC Bridge" slug={currentPost.slug}>
                      <NotionIpcFigure />
                    </LazyFigure>
                  </section>

                  <section id="target-coverage" className="article-section">
                    <h2>Target Capability Matrix &amp; Investigation Trace</h2>
                    <p>
                      REA routes each artifact to a specialized static reader, bring-your-own
                      disassembler, or live runtime bridge
                      <Sidenote
                        num={6}
                        label="Engine boundary"
                        note="JS/Electron, .NET, and archive inspections run without native engines; deep native decompilation requires a local Ghidra, Hopper, or Rizin backend."
                        refNum={2}
                      />. Filter the target matrix by engine requirement and inspect the
                      investigation waterfall below
                      <Sidenote
                        num={7}
                        label="Illustrative trace"
                        note="The 5-span DX-Ball walkthrough follows the published showcase. Its 940 ms timeline uses synthetic timings, not measured host latency."
                        refNum={3}
                      />.
                    </p>
                    <LazyFigure title="Target Capability Matrix" slug={currentPost.slug}>
                      <TargetMatrixFigure />
                    </LazyFigure>
                  </section>
                </>
              )}

              {currentPost.slug === "dx-ball-sound-pan" && (
                <>
                  <div id="dx-abstract" className="abstract-box">
                    <strong>Abstract.</strong> Decompilers frequently hide x87 stack-passing
                    conventions and inline float constants. In DX-Ball 1.07, the sound-panning
                    routine at <code>0x00406400</code> spans just 63 bytes of x86
                    <Sidenote
                      num={1}
                      label="Calling convention"
                      note="The initial pseudocode misses the stack input at [EBP+0x8]. The brick-hit caller at 0x411f40 passes 20 + 30 * tile_x."
                      refNum={3}
                    />, yet recovering its exact C implementation requires reconciling caller
                    disassembly, raw memory reads, and 3,205 oracle comparisons. The published
                    7 October 2026 checkpoint reports 55 maintained C functions, 45,380
                    comparisons with original code, and 33 functions with matching compiled bytes.
                  </div>

                  <section id="dx-disassembly" className="article-section">
                    <h2>63 Bytes at 0x00406400</h2>
                    <p>
                      The steps below follow the published REA 4.1.0 showcase
                      <Sidenote
                        num={2}
                        label="Float constants"
                        note="Byte reads established 1.5625 (0x420068), 500.0 (0x420070), and the initial pan_scale of 1.0 (0x4210a0)."
                        refNum={3}
                      />. Walk through the five steps from the stack input to the final{" "}
                      <code>__ftol</code> truncation. The slider simulates the reconstructed C
                      formula in JavaScript at a pan scale of 1.0. It does not run the x86 oracle.
                    </p>
                    <LazyFigure title="DX-Ball Sound-Panning" slug={currentPost.slug}>
                      <DxBallFigure />
                    </LazyFigure>
                  </section>

                  <section id="dx-verification" className="article-section">
                    <h2>Oracle Verification &amp; Investigation Trace</h2>
                    <p>
                      REA 4.1.0 supplied the instructions, caller information, and byte reads.
                      The <code>N0zoM1z0/dx-ball</code> project compared the C and original x86
                      return values for all 3,205 cases: integer x from 0 to 640 at pan scales
                      0, 0.5, 1, 20, and −1. A separate VC4.0 compiler replay matched all 63 bytes
                      <Sidenote
                        num={3}
                        label="Byte-exact proof"
                        note="The replay matches the function at 0x406400–0x40643e after applying reviewed relocations and checking the referenced constants."
                        refNum={3}
                      />. The waterfall below uses a synthetic 5-span timeline to show the
                      sequence of steps. Its 940 ms duration is not measured latency telemetry.
                    </p>
                    <LazyFigure title="Target Capability Matrix" slug={currentPost.slug}>
                      <TargetMatrixFigure />
                    </LazyFigure>
                  </section>
                </>
              )}

              {currentPost.slug === "notion-clipboard-bridge" && (
                <>
                  <div id="notion-abstract" className="abstract-box">
                    <strong>Abstract.</strong> Desktop Electron apps split privilege across
                    renderer bundles, preload bridges, and main-process IPC handlers. Using
                    REA’s static JavaScript application graph on Notion Desktop 7.6.1’s{" "}
                    <code>app.asar</code>
                    <Sidenote
                      num={1}
                      label="No native engine"
                      note="Electron ASAR inspection runs purely statically in REA without launching Ghidra, Hopper, or executing the target app."
                      refNum={4}
                    />, we trace <code>window.__electronApi.clipboard.write</code> across all
                    four hops without launching a native disassembler.
                  </div>

                  <section id="notion-hops" className="article-section">
                    <h2>Four-Hop IPC Trace</h2>
                    <p>
                      Select each hop to inspect the adapted bundle excerpt, REA static
                      observation, and provenance boundary
                      <Sidenote
                        num={2}
                        label="Evidence boundary"
                        note="The preload API and invoke ranges come from Notion Desktop 7.6.1 app.asar. The showcase follows the wrappers in the bundled desktop code, separately from the cached web probes."
                        refNum={4}
                      />, distinguishing verified desktop archive reads from separate cached
                      web-asset probes.
                    </p>
                    <LazyFigure title="Notion Clipboard IPC Bridge" slug={currentPost.slug}>
                      <NotionIpcFigure />
                    </LazyFigure>
                  </section>

                  <section id="notion-boundary" className="article-section">
                    <h2>Sender Trust Boundary</h2>
                    <p>
                      Before touching Electron’s native <code>clipboard.write</code>, the main
                      process checks the sender WebContents with{" "}
                      <code>isNotionWebContents(event.sender)</code>
                      <Sidenote
                        num={3}
                        label="Trust gate"
                        note="The guard checks event.sender in the privileged main process before forwarding the clipboard data."
                        refNum={4}
                      />. If the check fails, the handler returns without calling the clipboard API.
                    </p>
                  </section>
                </>
              )}

              {currentPost.slug === "agent-environments" && (
                <>
                  <div id="env-abstract" className="abstract-box">
                    <strong>Abstract.</strong> Training and evaluating coding agents against
                    live web apps is slow, flaky, and unsafe. REA’s{" "}
                    <code>export_environment_bundle</code>
                    <Sidenote
                      num={1}
                      label="Bundle contract"
                      note="export_environment_bundle writes a self-contained local environment folder from recorded CDP or HAR captures for repeatable offline rollouts."
                      refNum={2}
                    />{" "}
                    compiles recorded CDP and HAR captures into deterministic local harnesses
                    that expose structured WebMCP and Vercel UI SDK controls with zero live
                    side effects.
                  </div>

                  <section id="env-pipeline" className="article-section">
                    <h2>Offline RL Pipeline</h2>
                    <p>
                      Step through the four stages (Capture, Compile, Replay, and Grade) in this
                      simulated walkthrough of <code>capture_browser_scenario</code> and{" "}
                      <code>export_environment_bundle</code>
                      <Sidenote
                        num={2}
                        label="Interactive illustration"
                        note="The CLI invocations and JSON are examples, not live output. The zero-egress switch changes only the preview state."
                        refNum={2}
                      />.
                    </p>
                    <LazyFigure title="Offline RL Pipeline" slug={currentPost.slug}>
                      <AgentEnvFigure />
                    </LazyFigure>
                  </section>

                  <section id="env-benchmarks" className="article-section">
                    <h2>Agent Bridge Efficiency</h2>
                    <p>
                      Vercel UI SDK’s <code>snapshot()</code> and <code>act()</code> give agents
                      a structured alternative to browser automation. The chart shows the
                      published project settings benchmark, not an AgentEnv rollout benchmark
                      <Sidenote
                        num={3}
                        label="Bridge savings"
                        note="Vercel Labs reports medians from three runs per configuration with Sonnet through Claude Code. The browser-tool baselines use accessibility-tree reads and browser interactions."
                        refNum={1}
                      />.
                    </p>
                    <LazyFigure title="Agent Bridge Benchmarks" slug={currentPost.slug}>
                      <BenchmarkFigure />
                    </LazyFigure>
                  </section>
                </>
              )}

              <section id="references" className="article-section">
                <h2>Notes &amp; References</h2>
                <ol style={{ paddingLeft: "1.25rem", color: "var(--ink-secondary)" }}>
                  {REFERENCES.map((ref) => (
                    <li key={ref.num} style={{ marginBottom: "0.5rem" }}>
                      {ref.cite}{" "}
                      <a href={ref.url} target="_blank" rel="noreferrer">
                        {ref.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            </article>

            <div className="sidenotes-gutter" aria-hidden="true" />
          </div>
        )}
      </main>

      {consoleOpen && (
        <Suspense fallback={null}>
          <AgentConsoleDrawer open={consoleOpen} onOpenChange={setConsoleOpen} />
        </Suspense>
      )}
    </div>
  )
}
