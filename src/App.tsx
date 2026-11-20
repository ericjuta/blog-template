import { useEffect, useState } from "react"
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
  type PostCategory,
  type PostSlug,
} from "./data/blog-data"
import { CoverArtwork } from "./components/CoverArtwork"
import { DxBallFigure } from "./components/DxBallFigure"
import { BenchmarkFigure } from "./components/BenchmarkFigure"
import { TargetMatrixFigure } from "./components/TargetMatrixFigure"
import { NotionIpcFigure } from "./components/NotionIpcFigure"
import { AgentEnvFigure } from "./components/AgentEnvFigure"
import { AgentConsoleDrawer } from "./components/AgentConsoleDrawer"
import { Sidenote } from "./components/Citation"
import { DesignSystemGallery } from "./components/DesignSystemGallery"
import { getBlogAgent } from "./lib/blog-agent"

type CategoryFilter = "All" | PostCategory

export function App() {
  const [activePost, setActivePost] = useState<PostSlug | "__design-system__" | null>(() =>
    typeof window !== "undefined" && window.location.hash === "#design-system"
      ? "__design-system__"
      : "evidence-first-ui"
  )
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

  const currentPost = BLOG_POSTS.find((p) => p.slug === activePost) ?? featured
  const currentToc = POST_TOCS[currentPost.slug] ?? REPORT_TOC

  useEffect(() => {
    setActiveToc(currentToc[0]?.id ?? "dx-ball-trace")
    setReadProgress(0)
  }, [currentPost.slug, activePost])

  useEffect(() => {
    if (activePost === null) {
      setReadProgress(0)
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
  }, [activePost, currentToc])

  return (
    <div>
      <header className="site-header">
        <div className="site-header-inner">
          <a
            href="#top"
            className="brand"
            onClick={(e) => {
              e.preventDefault()
              setActivePost(null)
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          >
            <span className="brand-mark">REA</span>
            <span>REA Research</span>
          </a>

          <nav className="header-nav" aria-label="Primary navigation">
            <button
              type="button"
              className={`btn btn-sm ${activePost === null ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActivePost(null)}
            >
              All Research
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                activePost === "evidence-first-ui" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setActivePost("evidence-first-ui")}
            >
              Technical Report
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                activePost === "__design-system__" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setActivePost("__design-system__")}
            >
              Design System
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setConsoleOpen(true)}
            >
              Agent Console
            </button>
          </nav>
        </div>
        {activePost !== null && activePost !== "__design-system__" && (
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
        {activePost === "__design-system__" ? (
          <DesignSystemGallery onOpenConsole={() => setConsoleOpen(true)} />
        ) : activePost === null ? (
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
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActivePost(featured.slug)}
                >
                  Read interactive report →
                </button>
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
                onValueChange={(v) => setCategory(v as CategoryFilter)}
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
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setActivePost(post.slug)}
                      >
                        Open interactive post →
                      </button>
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
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setActivePost(null)}
                >
                  ← All research
                </button>
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
                        note="Checkpoint 7 Oct 2026: 63 compiled x86 bytes matched across 3,205 oracle comparisons against the original DX-Ball 1.07 routine."
                        refNum={3}
                      />, REA traces the x86 DirectSound pan routine at{" "}
                      <code>0x406409</code> through five evidence-backed steps—loading the
                      ball’s horizontal coordinate, multiplying by <code>1.5625</code>,
                      subtracting <code>500.0</code>, scaling, and truncating via{" "}
                      <code>__ftol</code>. Step through the assembly and probe the live oracle
                      below.
                    </p>
                    <DxBallFigure />
                  </section>

                  <section id="agent-bridge" className="article-section">
                    <h2>Why Headless + Agent-Ready Matters</h2>
                    <p>
                      Vercel UI SDK separates interaction state, roving focus, and ARIA
                      semantics from visual styling
                      <Sidenote
                        num={4}
                        label="Benchmark caveat"
                        note="Reported 3-run medians measure the settings-screen agent bridge benchmark. Efficiency gains come from structured snapshot()/act() calls, not raw browser DOM scraping."
                        refNum={1}
                      />. Because every control registers with <code>createAgent()</code>, an
                      agent can inspect and drive the exact same figures a human reader
                      uses—cutting token consumption and tool calls compared to raw browser
                      automation.
                    </p>
                    <BenchmarkFigure />

                    <Collapsible className="collapsible-box">
                      <CollapsibleTrigger className="collapsible-trigger">
                        <span>Methodology note: 3-run median benchmark details</span>
                      </CollapsibleTrigger>
                      <CollapsiblePanel>
                        <div className="collapsible-panel-inner">
                          All benchmark numbers reflect three-run medians from the Vercel UI SDK
                          agent bridge evaluation comparing browser-only automation against
                          structured <code>snapshot()</code> / <code>act()</code> calls. Open
                          the <strong>Agent Console</strong> in the top bar to run live bridge
                          actions against this page.
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
                        note="REA 4.1.0 located preload API and ipcMain ranges statically in app.asar; separate cached web-asset probes are explicitly marked as non-desktop captures."
                        refNum={4}
                      />{" "}
                      maps the full trust boundary from renderer preload wrappers to the
                      sender-checked <code>ipcMain.handle</code> clipboard sink.
                    </p>
                    <NotionIpcFigure />
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
                        note="The 940 ms waterfall below illustrates a typical 7-call DX-Ball session structure for interactive exploration; real timings vary by host and engine warm-up."
                        refNum={5}
                      />.
                    </p>
                    <TargetMatrixFigure />
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
                      note="The ball X coordinate arrives via a hidden caller stack slot; caller disassembly at 0x411f40 was required to recover the parameter boundary."
                      refNum={3}
                    />—yet recovering its exact C implementation requires reconciling caller
                    disassembly, raw memory reads of <code>.rdata</code> constants, and 3,205
                    oracle comparisons.
                  </div>

                  <section id="dx-disassembly" className="article-section">
                    <h2>63 Bytes at 0x00406400</h2>
                    <p>
                      Every step below is bound to an immutable REA Evidence ID
                      <Sidenote
                        num={2}
                        label="Float constants"
                        note="Raw .rdata reads resolved 1.5625 (0x420068) and 500.0 (0x4210a0) directly from the binary rather than relying on decompiler approximations."
                        refNum={3}
                      />. Walk through the five transitions from the hidden stack input to the
                      final <code>__ftol</code> truncation and test arbitrary ball X
                      coordinates against the DirectSound pan formula.
                    </p>
                    <DxBallFigure />
                  </section>

                  <section id="dx-verification" className="article-section">
                    <h2>Oracle Verification &amp; Investigation Trace</h2>
                    <p>
                      After reconstructing the C expression, REA’s verification harness ran
                      3,205 input combinations against the original x86 binary and confirmed
                      all 63 compiled bytes match
                      <Sidenote
                        num={3}
                        label="Byte-exact proof"
                        note="Verification compares both functional outputs across 3,205 inputs and the exact 63-byte compiled machine-code footprint."
                        refNum={3}
                      />. Inspect the illustrative tool latency trace below.
                    </p>
                    <TargetMatrixFigure />
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
                      Select each hop to inspect the exact bundle excerpt, REA static
                      observation, and provenance boundary
                      <Sidenote
                        num={2}
                        label="Evidence boundary"
                        note="Preload and ipcMain ranges come from Notion Desktop 7.6.1 app.asar; wrapper glue was connected by reading bundled code, distinct from cached web probes."
                        refNum={4}
                      />—distinguishing verified desktop archive reads from separate cached
                      web-asset probes.
                    </p>
                    <NotionIpcFigure />
                  </section>

                  <section id="notion-boundary" className="article-section">
                    <h2>Sender Trust Boundary</h2>
                    <p>
                      Before touching Electron’s native <code>clipboard.write</code>, the main
                      process validates the IPC sender frame via{" "}
                      <code>isNotionWebContents(event.sender)</code>
                      <Sidenote
                        num={3}
                        label="Trust gate"
                        note="Sender validation runs in the privileged main process prior to any OS clipboard mutation, blocking arbitrary renderer frames."
                        refNum={4}
                      />. Untrusted frames are rejected before any OS clipboard mutation
                      occurs.
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
                      Step through the four stages—Capture, Compile, Replay, and Grade—to see
                      how REA pins network responses by SHA-256 digest and isolates agent
                      rollouts from external systems
                      <Sidenote
                        num={2}
                        label="Interactive illustration"
                        note="The pipeline explorer below is an illustrative walkthrough of the four stages; toggling zero-egress updates the simulated replay preview."
                        refNum={2}
                      />.
                    </p>
                    <AgentEnvFigure />
                  </section>

                  <section id="env-benchmarks" className="article-section">
                    <h2>Agent Bridge Efficiency</h2>
                    <p>
                      Pairing deterministic offline environments with Vercel UI SDK’s{" "}
                      <code>snapshot()</code> and <code>act()</code> bridge eliminates DOM
                      scraping overhead during rollouts
                      <Sidenote
                        num={3}
                        label="Bridge savings"
                        note="Three-run median numbers from the Vercel UI SDK settings-screen evaluation; gains come from structured tool calls rather than pixel/DOM loops."
                        refNum={1}
                      />.
                    </p>
                    <BenchmarkFigure />
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

      <AgentConsoleDrawer open={consoleOpen} onOpenChange={setConsoleOpen} />
    </div>
  )
}
