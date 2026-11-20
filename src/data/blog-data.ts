export type PostSlug =
  | "evidence-first-ui"
  | "dx-ball-sound-pan"
  | "notion-clipboard-bridge"
  | "agent-environments"

export type PostCategory = "Technical report" | "Case study" | "Research"

export type BlogPostMeta = {
  slug: PostSlug
  category: PostCategory
  date: string
  shortDate: string
  readTime: string
  title: string
  subtitle: string
  authors: string
  featured?: boolean
  artwork: "moire" | "silicon" | "ipc" | "env"
  metrics: Array<{ label: string; value: string }>
}

export const BLOG_POSTS: Array<BlogPostMeta> = [
  {
    slug: "evidence-first-ui",
    category: "Technical report",
    date: "November 20, 2026",
    shortDate: "11/26",
    readTime: "12 min read",
    title: "Evidence-First Interfaces: Pairing REA with Vercel UI SDK",
    subtitle:
      "How a 229-tool reverse-engineering MCP server and a behavior-level UI SDK eliminate DOM scraping, expose typed evidence graphs, and cut agent token cost by 76%.",
    authors: "REA Research × UI Systems",
    featured: true,
    artwork: "moire",
    metrics: [
      { label: "REA MCP tools", value: "229" },
      { label: "Fewer tokens (React)", value: "76%" },
      { label: "Fewer tool calls", value: "59%" },
      { label: "Target classes", value: "40+" },
    ],
  },
  {
    slug: "dx-ball-sound-pan",
    category: "Case study",
    date: "October 7, 2026",
    shortDate: "10/26",
    readTime: "7 min read",
    title: "DX-Ball 1.07: From 63 Bytes of x86 to Verified C",
    subtitle:
      "Following a brick-hit sound call into 0x00406400, reconciling decompiler blind spots with raw x86 instructions, and verifying 3,205 oracle cases.",
    authors: "REA Native Team",
    artwork: "silicon",
    metrics: [
      { label: "Maintained C functions", value: "55" },
      { label: "Oracle comparisons", value: "45,380" },
      { label: "Exact byte matches", value: "33" },
      { label: "Function bytes", value: "63 B" },
    ],
  },
  {
    slug: "notion-clipboard-bridge",
    category: "Case study",
    date: "August 19, 2026",
    shortDate: "08/26",
    readTime: "6 min read",
    title: "Tracing Notion Desktop's Electron Clipboard Bridge",
    subtitle:
      "Resolving window.__electronApi.clipboard.write through preload wrappers, ipcRenderer.invoke, and main-process sender checks without source code.",
    authors: "REA JavaScript Team",
    artwork: "ipc",
    metrics: [
      { label: "Package target", value: "Notion 7.6.1" },
      { label: "IPC channel", value: "notion:clipboard:write" },
      { label: "Bundle hops", value: "4" },
      { label: "Native engine needed", value: "None" },
    ],
  },
  {
    slug: "agent-environments",
    category: "Research",
    date: "September 28, 2026",
    shortDate: "09/26",
    readTime: "5 min read",
    title: "AgentEnv: Turning Recorded Captures into Offline RL Harnesses",
    subtitle:
      "Compiling HAR/CDP observations into deterministic local tool environments where agents practice tasks with zero live side effects.",
    authors: "REA Environments Lab",
    artwork: "env",
    metrics: [
      { label: "Capture formats", value: "CDP · HAR · SAZ" },
      { label: "Live side effects", value: "0" },
      { label: "WebMCP bridge", value: "snapshot · query · act" },
      { label: "Determinism", value: "Byte-stable" },
    ],
  },
]

export type TocSection = {
  id: string
  label: string
  level: 2 | 3
}

export const REPORT_TOC: Array<TocSection> = [
  { id: "dx-ball-trace", label: "Case I: DX-Ball x86 → C", level: 2 },
  { id: "agent-bridge", label: "Headless + Agent-Ready", level: 2 },
  { id: "notion-ipc", label: "Case II: Notion IPC bridge", level: 2 },
  { id: "target-coverage", label: "Target matrix & trace", level: 2 },
  { id: "references", label: "Notes & references", level: 2 },
]

export const POST_TOCS: Record<PostSlug, Array<TocSection>> = {
  "evidence-first-ui": REPORT_TOC,
  "dx-ball-sound-pan": [
    { id: "dx-abstract", label: "Abstract", level: 2 },
    { id: "dx-disassembly", label: "63 bytes at 0x00406400", level: 2 },
    { id: "dx-verification", label: "Oracle verification", level: 2 },
    { id: "references", label: "Notes & references", level: 2 },
  ],
  "notion-clipboard-bridge": [
    { id: "notion-abstract", label: "Abstract", level: 2 },
    { id: "notion-hops", label: "Four-hop IPC trace", level: 2 },
    { id: "notion-boundary", label: "Sender trust boundary", level: 2 },
    { id: "references", label: "Notes & references", level: 2 },
  ],
  "agent-environments": [
    { id: "env-abstract", label: "Abstract", level: 2 },
    { id: "env-pipeline", label: "Offline RL pipeline", level: 2 },
    { id: "env-benchmarks", label: "Agent bridge efficiency", level: 2 },
    { id: "references", label: "Notes & references", level: 2 },
  ],
}

export type BenchmarkFramework = "react" | "vue" | "svelte"

export type BenchmarkMetricKey = "toolCalls" | "tokensK" | "timeSec" | "costUsd"

export type BenchmarkRow = {
  framework: BenchmarkFramework
  frameworkLabel: string
  competitor: string
  competitorToolCalls: number
  competitorTokensK: number
  competitorTimeSec: number
  competitorCostUsd: number
  secondCompetitor?: {
    name: string
    toolCalls: number
    tokensK: number
    timeSec: number
    costUsd: number
  }
  uiSdkToolCalls: number
  uiSdkTokensK: number
  uiSdkTimeSec: number
  uiSdkCostUsd: number
  deltas: {
    toolCalls: string
    tokensK: string
    timeSec: string
    costUsd: string
  }
}

export const UI_SDK_BENCHMARKS: Array<BenchmarkRow> = [
  {
    framework: "react",
    frameworkLabel: "React",
    competitor: "Base UI + browser tools",
    competitorToolCalls: 17,
    competitorTokensK: 291.7,
    competitorTimeSec: 53,
    competitorCostUsd: 0.139,
    secondCompetitor: {
      name: "Ark UI + browser tools",
      toolCalls: 19,
      tokensK: 330.9,
      timeSec: 65,
      costUsd: 0.144,
    },
    uiSdkToolCalls: 7,
    uiSdkTokensK: 69.5,
    uiSdkTimeSec: 31,
    uiSdkCostUsd: 0.044,
    deltas: {
      toolCalls: "59% fewer",
      tokensK: "76% fewer",
      timeSec: "41% faster",
      costUsd: "68% cheaper",
    },
  },
  {
    framework: "vue",
    frameworkLabel: "Vue",
    competitor: "Reka UI + browser tools",
    competitorToolCalls: 16,
    competitorTokensK: 226.5,
    competitorTimeSec: 56,
    competitorCostUsd: 0.113,
    uiSdkToolCalls: 9,
    uiSdkTokensK: 90.2,
    uiSdkTimeSec: 34,
    uiSdkCostUsd: 0.051,
    deltas: {
      toolCalls: "44% fewer",
      tokensK: "60% fewer",
      timeSec: "39% faster",
      costUsd: "55% cheaper",
    },
  },
  {
    framework: "svelte",
    frameworkLabel: "Svelte",
    competitor: "Bits UI + browser tools",
    competitorToolCalls: 17,
    competitorTokensK: 259.1,
    competitorTimeSec: 56,
    competitorCostUsd: 0.123,
    uiSdkToolCalls: 8,
    uiSdkTokensK: 92.8,
    uiSdkTimeSec: 30,
    uiSdkCostUsd: 0.056,
    deltas: {
      toolCalls: "53% fewer",
      tokensK: "64% fewer",
      timeSec: "45% faster",
      costUsd: "54% cheaper",
    },
  },
]

export type DxBallStep = {
  id: string
  number: string
  title: string
  reaTool: string
  reaQuery: string
  asmLines: Array<number>
  cLines: Array<number>
  explanation: string
  evidenceId: string
  decodedConstant?: string
}

export const DXBALL_ASM = [
  "0x406409: MOV  EAX, dword ptr [EBP + 0x8]",
  "0x40640c: MOV  dword ptr [EBP - 0xc], EAX",
  "0x40640f: FILD dword ptr [EBP - 0xc]",
  "0x406415: FMUL double ptr [0x00420068]",
  "0x40641e: FSUB double ptr [0x00420070]",
  "0x406427: FMUL double ptr [0x004210a0]",
  "0x406430: CALL 0x0041678c  ; __ftol",
  "0x40643e: RET",
]

export const DXBALL_C = [
  "DxBallInt dxball_screen_pan(DxBallInt x) {",
  "    double pan = (double)x;",
  "    pan = pan * 1.5625;",
  "    pan = pan - 500.0;",
  "    pan = pan * dxball_pan_scale;",
  "    return (DxBallInt)pan;",
  "}",
]

export const DXBALL_STEPS: Array<DxBallStep> = [
  {
    id: "step-01",
    number: "01",
    title: "Recover the hidden stack input",
    reaTool: "analyze_function",
    reaQuery: '{ "procedure": "0x406400" }',
    asmLines: [0, 1, 2],
    cLines: [0, 1],
    explanation:
      "The initial pseudocode emitted FUN_00406400(void), hiding the parameter. REA's instruction view exposes [EBP+0x8] loaded via FILD, and following caller 0x411f40 proves x = 20 + 30 * tile_x.",
    evidenceId: "ev:dxball:fn:0x406400",
  },
  {
    id: "step-02",
    number: "02",
    title: "Multiply by 1.5625 (0x420068)",
    reaTool: "read_bytes",
    reaQuery: '{ "address": "0x420068", "length": 16 }',
    asmLines: [3],
    cLines: [2],
    explanation:
      "FMUL reads an IEEE-754 little-endian double at 0x420068. REA's byte read returns 000000000000f93f, decoding to 1.5625 (1000 / 640 screen width).",
    evidenceId: "ev:dxball:mem:0x420068",
    decodedConstant: "000000000000f93f → 1.5625",
  },
  {
    id: "step-03",
    number: "03",
    title: "Center around screen x = 320",
    reaTool: "read_bytes",
    reaQuery: '{ "address": "0x420070", "length": 8 }',
    asmLines: [4],
    cLines: [3],
    explanation:
      "FSUB subtracts the adjacent double at 0x420070 (0000000000407f40 → 500.0). At x = 320, 320 × 1.5625 − 500.0 equals 0.0 (dead center).",
    evidenceId: "ev:dxball:mem:0x420070",
    decodedConstant: "0000000000407f40 → 500.0",
  },
  {
    id: "step-04",
    number: "04",
    title: "Apply global dxball_pan_scale",
    reaTool: "read_bytes",
    reaQuery: '{ "address": "0x4210a0", "length": 8 }',
    asmLines: [5],
    cLines: [4],
    explanation:
      "A second FMUL scales the offset by the mutable global at 0x4210a0 (initial bytes 000000000000f03f → 1.0), allowing stereo width tuning or inversion.",
    evidenceId: "ev:dxball:mem:0x4210a0",
    decodedConstant: "000000000000f03f → 1.0",
  },
  {
    id: "step-05",
    number: "05",
    title: "Truncate via __ftol and verify 63 bytes",
    reaTool: "verify_reconstruction",
    reaQuery: '{ "cases": 3205, "toolchain": "VC4.0" }',
    asmLines: [6, 7],
    cLines: [5, 6],
    explanation:
      "CALL 0x0041678c invokes __ftol to return a 32-bit integer. Recompiling with VC4.0 matches all 63 original bytes and passes 3,205 differential x86 oracle cases.",
    evidenceId: "ev:dxball:verify:3205",
  },
]

export type NotionHop = {
  id: string
  stage: string
  process: "Renderer" | "Preload" | "IPC Bus" | "Main Process"
  file: string
  location: string
  summary: string
  reaOutput: string
  code: string
}

export const NOTION_HOPS: Array<NotionHop> = [
  {
    id: "page-api",
    stage: "01 · Page-facing API",
    process: "Renderer",
    file: "tab_browser_view/preload.js",
    location: "preload.js:1:22764–22828",
    summary:
      "The web editor calls window.__electronApi.clipboard.write(data) without touching Electron internals directly.",
    reaOutput:
      'api_key: "__electronApi"\napi_status: "dynamic"\nsource: preload.js:1:22764–22828',
    code: `const clipboardApi = {\n  write: invokerInMain("notion:clipboard:write"),\n};\n// Exposed through contextBridge as window.__electronApi.clipboard`,
  },
  {
    id: "preload-wrapper",
    stage: "02 · Preload wrapper",
    process: "Preload",
    file: "tab_browser_view/preload.js",
    location: "preload.js:1:6486–6522",
    summary:
      "invokerInMain curries the channel name and delegates every call to ipcRenderer.invoke.",
    reaOutput:
      'operation: "invoke"\nchannel_expression: "e"\nsource: preload.js:1:6486–6522',
    code: `function invokerInMain(channel) {\n  return (...args) => invokeInMainAndReturnResult(channel, ...args);\n}\n\nfunction invokeInMainAndReturnResult(channel, ...args) {\n  return ipcRenderer.invoke(channel, ...args);\n}`,
  },
  {
    id: "ipc-channel",
    stage: "03 · Main registration",
    process: "IPC Bus",
    file: "main/index.js",
    location: "channel: notion:clipboard:write",
    summary:
      "handleRequestFromRenderer wraps ipcMain.handle so receivers register cleanly against the shared channel string.",
    reaOutput:
      'channel: "notion:clipboard:write"\nregistration: "ipcMain.handle"\nprovenance: app.asar (Notion 7.6.1)',
    code: `const handleRequestFromRenderer = {\n  addListener(channel, handler) {\n    ipcMain.handle(channel, handler);\n  },\n};`,
  },
  {
    id: "system-clipboard",
    stage: "04 · Sender gate & write",
    process: "Main Process",
    file: "main/index.js",
    location: "isNotionWebContents(event.sender)",
    summary:
      "Before writing text + HTML with the <!-- notionvc: copy-id --> marker, the main process verifies the sender WebContents.",
    reaOutput:
      'guard: "isNotionWebContents(event.sender)"\nsink: "electron.clipboard.write(data)"\nvirtual_clipboard: "text/_notion-blocks-v3-production"',
    code: `handleRequestFromRenderer.addListener(\n  "notion:clipboard:write",\n  (event, data) =>\n    isNotionWebContents(event.sender)\n      ? clipboard.write(data)\n      : undefined\n);`,
  },
]

export type TargetRow = {
  id: string
  target: string
  family: "Native" | "JS & Web" | "Mobile & Managed" | "Firmware & Data"
  engine: "Built-in static" | "Bring-your-own engine" | "Live runtime"
  returns: string
  tool: string
  prerequisite: string
}

export const REA_TARGETS: Array<TargetRow> = [
  {
    id: "native-bins",
    target: "Native binaries (ELF / Mach-O / PE / DOS)",
    family: "Native",
    engine: "Bring-your-own engine",
    returns: "Pseudocode, assembly, callers, callees, strings, CFG, xrefs",
    tool: "open_binary → analyze_function",
    prerequisite: "Hopper, Ghidra, IDA Pro, or Kuna",
  },
  {
    id: "go-rust-bins",
    target: "Go & Rust cargo-auditable binaries",
    family: "Native",
    engine: "Built-in static",
    returns: "Compiler version, module graph, crate versions, build settings",
    tool: "inspect_go_binary / inspect_rust_binary",
    prerequisite: "None (built-in static parser)",
  },
  {
    id: "gpu-models",
    target: "CUDA/HIP code objects & GGUF / safetensors",
    family: "Native",
    engine: "Built-in static",
    returns: "Kernel parameters, PTX text, tensor declarations, header digests",
    tool: "inspect_gpu_code_objects / inspect_model_artifact",
    prerequisite: "None (header & fatbin parser)",
  },
  {
    id: "js-electron",
    target: "Electron ASAR & bundled JavaScript",
    family: "JS & Web",
    engine: "Built-in static",
    returns: "Module graph, IPC boundaries, preload APIs, route tables, fuses",
    tool: "analyze_javascript_application",
    prerequisite: "Node.js 22/24/26 (no native engine)",
  },
  {
    id: "web-cdp",
    target: "Live web apps & WebMCP pages",
    family: "JS & Web",
    engine: "Live runtime",
    returns: "DOM capture, scripts, WebMCP schemas, AgentEnv RL bundles",
    tool: "capture_browser_scenario → export_environment_bundle",
    prerequisite: "Loopback CDP Chrome-family browser",
  },
  {
    id: "network-captures",
    target: "HAR, Fiddler SAZ, mitmproxy, qlog",
    family: "JS & Web",
    engine: "Built-in static",
    returns: "Requests, protobuf/gRPC payloads, source locations, stream stats",
    tool: "inspect_web_network_capture",
    prerequisite: "Saved capture file (no live fetch)",
  },
  {
    id: "android-apk",
    target: "Android APKs, signatures & Flutter",
    family: "Mobile & Managed",
    engine: "Bring-your-own engine",
    returns: "Manifest, JADX decompilation, v1–v3.1 cert lineage, Dart hashes",
    tool: "inspect_android_package / inspect_apk_signature",
    prerequisite: "Static for signatures/Flutter; JADX + JDK for Java",
  },
  {
    id: "dotnet-il2cpp",
    target: ".NET PE/CLI & Unity IL2CPP metadata",
    family: "Mobile & Managed",
    engine: "Built-in static",
    returns: "CIL hashes, P/Invoke maps, global-metadata.dat types & methods",
    tool: "inspect_managed_artifact / inspect_il2cpp_metadata",
    prerequisite: "None (static metadata decoder)",
  },
  {
    id: "firmware-pcap",
    target: "Firmware, PCAPs & sigrok logic traces",
    family: "Firmware & Data",
    engine: "Bring-your-own engine",
    returns: "Firmware regions, DNS/TLS summaries, decoded bus annotations",
    tool: "inspect_firmware_regions / inspect_pcap_capture",
    prerequisite: "Binwalk/Unblob, TShark 4.x, or sigrok-cli on Linux",
  },
  {
    id: "sqlite-pyc-beam",
    target: "SQLite + WAL, CPython .pyc & Erlang BEAM",
    family: "Firmware & Data",
    engine: "Built-in static",
    returns: "Schema/rows, marshal code objects, BEAM atoms & export tables",
    tool: "inspect_sqlite_database / inspect_python_pyc",
    prerequisite: "None (built-in static reader)",
  },
]

export const INVESTIGATION_SPANS = [
  {
    value: "session",
    label: "rea: dx-ball investigation",
    start: 0,
    duration: 940,
    meta: "5 calls · 100% cited",
    children: [
      {
        value: "open",
        label: "open_binary(DXBALL.EXE)",
        start: 0,
        duration: 210,
        meta: "sha256 bound",
      },
      {
        value: "fn-pan",
        label: "analyze_function(0x406400)",
        start: 220,
        duration: 185,
        meta: "summary + insns",
      },
      {
        value: "fn-caller",
        label: "analyze_function(0x411f40)",
        start: 415,
        duration: 165,
        meta: "20 + 30*tile_x",
      },
      {
        value: "read-mem",
        label: "read_bytes(0x420068, 0x4210a0)",
        start: 590,
        duration: 90,
        meta: "1.5625, 500, 1.0",
      },
      {
        value: "ui-act",
        label: "ui-sdk: agent.act(verify)",
        start: 695,
        duration: 245,
        meta: "3,205 cases pass",
      },
    ],
  },
]

export const INVESTIGATION_META = {
  session: { phase: "End-to-end", note: "940 ms total" },
  open: { phase: "Bind", note: "SHA-256 pinned" },
  "fn-pan": { phase: "Static", note: "Revealed [EBP+8]" },
  "fn-caller": { phase: "Static", note: "Brick hit caller" },
  "read-mem": { phase: "Data", note: "3 IEEE doubles" },
  "ui-act": { phase: "UI SDK", note: "7 tool calls total" },
} satisfies Record<string, { phase: string; note: string }>

export const REFERENCES = [
  {
    num: 1,
    cite: "Vercel Labs (2026). “Introducing UI SDK: A library of behaviors to build your components. Made for agents.”",
    url: "https://github.com/vercel-labs/ui",
    label: "github.com/vercel-labs/ui",
  },
  {
    num: 2,
    cite: "REA Project (2026). “Reverse Engineer Anything: One MCP for reverse engineering across binaries, applications, and runtime behavior (v6.8.0, 229 tools).”",
    url: "https://github.com/morluto/rea",
    label: "github.com/morluto/rea",
  },
  {
    num: 3,
    cite: "REA Showcase (2026). “Rebuilding DX-Ball 1.07 from its executable: sound panning reconstruction & 3,205 oracle checks.”",
    url: "https://rea.tools/showcase/dx-ball/",
    label: "rea.tools/showcase/dx-ball",
  },
  {
    num: 4,
    cite: "REA Showcase (2026). “How Notion Desktop 7.6.1 copies text and HTML across its Electron preload/IPC bridge.”",
    url: "https://rea.tools/showcase/notion/",
    label: "rea.tools/showcase/notion",
  },
  {
    num: 5,
    cite: "Editorial craft references: SID-2 Technical Report (three-column reading grid, inline figure toggles, margin sidenotes) and Architect Labs Frostbite (editorial left rail, serif display headlines, cobalt telemetry).",
    url: "https://www.sid.ai/research/sid-2-technical-report",
    label: "sid.ai & architectlabs.com",
  },
]
