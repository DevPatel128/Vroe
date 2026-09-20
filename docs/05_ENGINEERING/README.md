# 05 Engineering

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

- **Purpose:** how the site is built, secured, shipped, watched and kept fast and
  cheap. This is the source of truth for building software here.
- **Belongs here:** architecture, security, data, infrastructure, the pipeline,
  reliability, performance, cost, and how to work in the repository.
- **Does not belong here:** product and research content, or the procedures a
  person follows when something breaks ([06_OPERATIONS](../06_OPERATIONS/README.md)).
  Engineering says how it is designed; operations says what to do.
- **Important files:** the map below. How this repository meets the company
  engineering framework, section by section, is in
  [FOUNDATION.md](FOUNDATION/FOUNDATION.md).
- **Source of truth:** each subfolder owns one concern. Do not copy engineering
  rules into product documents; link here.

| Folder | Owns | Start with |
| --- | --- | --- |
| [FOUNDATION](FOUNDATION/) | Engineering principles, the quality gate, and framework status | [FOUNDATION.md](FOUNDATION/FOUNDATION.md) |
| [DEVELOPMENT](DEVELOPMENT/) | How to make a change | [DEVELOPMENT.md](DEVELOPMENT/DEVELOPMENT.md) |
| [ARCHITECTURE](ARCHITECTURE/) | The build, the request path, SEO and structured data | [ARCHITECTURE.md](ARCHITECTURE/ARCHITECTURE.md) |
| [INFRASTRUCTURE](INFRASTRUCTURE/) | Cloudflare, DNS, first-time setup | [INFRASTRUCTURE.md](INFRASTRUCTURE/INFRASTRUCTURE.md) |
| [SECURITY](SECURITY/) | Threat model, headers, CSP, the form pipeline | [SECURITY.md](SECURITY/SECURITY.md) |
| [AI](AI/) | How agents navigate, propose and report | [AI-WORKFLOW.md](AI/AI-WORKFLOW.md) |
| [CI-CD](CI-CD/) | The workflows and what gates a deploy | [CI-CD.md](CI-CD/CI-CD.md) |
| [DATA](DATA/) | What is stored, for how long, and why | [DATA.md](DATA/DATA.md) |
| [RELIABILITY](RELIABILITY/) | How it fails, and how it recovers | [RELIABILITY.md](RELIABILITY/RELIABILITY.md) |
| [PERFORMANCE](PERFORMANCE/) | Budgets and how they are enforced | [PERFORMANCE.md](PERFORMANCE/PERFORMANCE.md) |
| [COST](COST/) | What it costs, and the cheaper-alternative rule | [COST.md](COST/COST.md) |
| [DEVELOPER-EXPERIENCE](DEVELOPER-EXPERIENCE/) | Local setup, commands, dependency policy | [DEVELOPER-EXPERIENCE.md](DEVELOPER-EXPERIENCE/DEVELOPER-EXPERIENCE.md) |
