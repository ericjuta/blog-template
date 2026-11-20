---
name: read-rea-research
description: Find and cite published REA Research articles. Use when a question refers to this blog's evidence-first UI report, DX-Ball audio case study, Notion clipboard trace, or AgentEnv offline harnesses.
---

# Read REA Research

Use this skill for questions about what the publication reported, not as a substitute for the documentation of the products it cites.

1. Fetch the [research post index](https://example.com/posts/llms.txt) and pick the article closest to the question. Use the flagship technical report for the overview and the dedicated case study when asked about a particular finding.
2. Fetch the article's Markdown URL with an ordinary HTTP GET. Use its headings and Notes & References to trace each claim back to its context. For figures requiring interaction, use the linked HTML version.
3. Cite the HTML article and name the relevant section. For quantitative claims, include the tested setup and comparison rather than generalizing from a single benchmark. Distinguish what the article directly reports from your own inference.
4. If the article is unavailable or does not answer the question, say so. Use its references only when they substantiate the missing detail; do not imply the site exposes a live analysis API or a remote MCP endpoint.
