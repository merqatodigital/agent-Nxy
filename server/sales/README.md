# Nyx Sales Execution Layer

This directory is intentionally separate from `server/agent/`.

`server/agent/` owns the core objective/task/runtime engine.
`server/sales/` owns deterministic sales execution capabilities that plug into that engine.

Current modules:

- `policy.ts` — CRM cold-outreach safeguards
- `scoring.ts` — evidence-based prospect scoring
- `dedupe.ts` — domain normalization and duplicate control
- `discovery/provider.ts` — discovery provider contract; never fabricates candidates
- `enrichment/publicContacts.ts` — public business contact extraction without guessed emails
- `campaign/rules.ts` — send limits and follow-up rules
- `nomads/intent.ts` — intent scoring for public digital-nomad/remote-worker signals
- `research/provider.ts` — crawler-neutral research contract
- `research/safeFetch.ts` — real public-web fetch with SSRF/private-network protections
- `research/router.ts` — research-provider fallback routing
- `research/runtimeAdapter.ts` — adapter to Nyx core tool registry
- `runtimeTools.ts` — registers sales tools and replaces mock `WEB_SCRAPE` with real fetching

Advanced crawlers such as Crawlee or a Scrapling sidecar should implement `ResearchProvider` rather than changing the agent runtime.
