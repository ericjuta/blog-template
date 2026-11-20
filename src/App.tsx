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
import { AgentConsoleDrawer } from "./components/AgentConsoleDrawer"
import { getBlogAgent } from "./lib/blog-agent"

type CategoryFilter = "All" | PostCategory

export function App() {
  const [activePost, setActivePost] = useState<PostSlug | null>(
    "evidence-first-ui"
  )
  const [category, setCategory] = useState<CategoryFilter>("All")
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [activeToc, setActiveToc] = useState<string>(REPORT_TOC[0]?.id ?? "dx-ball-trace")

  useEffect(() => {
    getBlogAgent()
  }, [])

  const featured = BLOG_POSTS[0]
  const filteredPosts = BLOG_POSTS.filter((p) =>
    category === "All" ? true : p.category === category
  )

  const currentPost = BLOG_POSTS.find((p) => p.slug === activePost) ?? featured

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
              className="btn btn-sm"
              onClick={() => setConsoleOpen(true)}
            >
              Agent Console
            </button>
          </nav>
        </div>
      </header>

      <main id="top">
        {activePost === null ? (
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
                {REPORT_TOC.map((item) => (
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

              <div className="abstract-box">
                <strong>Abstract.</strong> Reverse engineering produces graphs of
                disassembly, memory reads, IPC hops, and residual unknowns. Static blog
                prose flattens that structure. By pairing REA’s evidence-backed analysis
                model with Vercel UI SDK’s accessible, agent-addressable primitives, every
                figure in this report becomes an inspectable instrument for both human
                readers and coding agents.
              </div>

              <section id="dx-ball-trace" className="article-section">
                <h2>Case I: DX-Ball Sound-Panning Reconstruction</h2>
                <p>
                  In the DX-Ball showcase, REA traces the x86 DirectSound pan routine at{" "}
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
                  semantics from visual styling. Because every control registers with{" "}
                  <code>createAgent()</code>, an agent can inspect and drive the exact same
                  figures a human reader uses—cutting token consumption and tool calls
                  compared to raw browser automation.
                </p>
                <BenchmarkFigure />

                <Collapsible className="collapsible-box">
                  <CollapsibleTrigger className="collapsible-trigger">
                    <span>Methodology note: 3-run median benchmark details</span>
                    <span className="mono" style={{ fontSize: "0.78rem" }}>
                      Toggle
                    </span>
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
                  Inspecting Notion Desktop’s <code>app.asar</code> maps the full trust
                  boundary from renderer preload wrappers to the sender-checked{" "}
                  <code>ipcMain.handle</code> clipboard sink.
                </p>
                <NotionIpcFigure />
              </section>

              <section id="target-coverage" className="article-section">
                <h2>Target Capability Matrix &amp; Investigation Trace</h2>
                <p>
                  REA routes each artifact to a specialized static reader, bring-your-own
                  disassembler, or live runtime bridge. Filter the target matrix by engine
                  requirement and inspect the 940 ms DX-Ball investigation waterfall below.
                </p>
                <TargetMatrixFigure />
              </section>

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
          </div>
        )}
      </main>

      <AgentConsoleDrawer open={consoleOpen} onOpenChange={setConsoleOpen} />
    </div>
  )
}
