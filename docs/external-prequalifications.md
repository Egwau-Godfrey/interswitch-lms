# External pre-qualification interface

The Agent Whitelist page includes an externally pre-qualified agents section. Administrators can upload a CSV or Excel score file, choose how many new valid agents to release, or import all remaining agents. Previously released agent IDs are skipped globally, so repeated uploads advance through the score-ordered pool.

The page shows the latest batch's selected, awaiting-signup, joined, activated, and registration-rate figures. Administrators can switch between awaiting-signup and joined agents and export the current latest-batch group as CSV for Interswitch outreach.

Write access to agents is required for uploads. Existing whitelist permissions continue to control ordinary whitelist actions.

## Pre-qualified agents table

The table lists every imported agent with search by agent ID, first/previous/next/last pagination, and configurable page sizes (10/20/30/50/100). Filtering is scoped to the selected import batch and the awaiting-signup/joined status; changing the search text, batch, status, or page size returns to page 1. Rows show rank, external score and band, status, starter limit, effective and available limits, and joined/activated dates. Individual agent lookups use `prequalificationApi.getAgent(agentId)`.

The effective limit for an external agent comes from a dedicated external progression limit. It begins at the starter limit and cannot inherit an older internal or manually assigned limit.

## External-authoritative display

Wherever an agent's `credit_profile.score_source` is `external_import`, the interface presents the external qualification as authoritative instead of the internal 0–1 score:

- Agent detail pages (super-admin and user) show the raw external score, band, current effective limit, external maximum, and available amount, with a note that internal scoring continues as shadow data. The credit-score tab splits into an "Authoritative External Qualification" card and an "Internal Shadow History" chart.
- The scoring table flags external agents with an "External" badge and shows the external band in place of the internal risk badge; the detail drawer swaps the score card to the external score/band and hides internal-only factor and penalty sections.
- The scoring dashboard gains an "External" stat card (`external_authoritative_count`) and a score-source filter (`all` / `external_import` / `internal`) wired to the `score_source` query parameter on the scored-agents list and export endpoints.
- Agent summary tables show an "External · Band X" subtitle and use `credit_profile.available_loan_limit` for capacity columns.

Internal-only agents render exactly as before, so existing screens are unchanged for them.

## Re-scoring behaviour

Triggering a re-score on an externally authoritative agent reports: "Internal shadow score refreshed; external qualification remains authoritative." The response carries `score_source` and `credit_profile` so the UI can distinguish the two cases.

## Changelog

- **2026-09-10 — Whitelist page integration.** Upload dialog with "first N agents" selection, latest-batch statistics, awaiting-signup/joined tabs, Interswitch CSV export, and prequalification API client.
- **2026-09-10 (later) — Table usability.** Search by agent ID, full pagination controls, and configurable page sizes for the pre-qualified agents table.
- **2026-09-14 — External-authoritative UI.** `CreditProfile` type threaded through agent, whitelist, loan, and scoring types; external score/band cards on agent detail pages; scoring table badges, drawer changes, score-source filter, and External stat card; fixed the seven pre-existing TypeScript errors in the touched agent files.
- **2026-09-15 — Starter-limit isolation.** Added `current_external_limit` so externally qualified agents cannot inherit a higher internal/manual limit.
