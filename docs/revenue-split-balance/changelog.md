# Changelog

## v1.0.0 — 2026-07-22

### Added
- `src/lib/api/revenue.ts` — API service for `GET /dashboard/revenue-balance`
- `src/components/dashboard/use-revenue-balance.ts` — Data-fetching hook with 5-min auto-refresh
- `src/components/dashboard/revenue-balance-card.tsx` — Card UI component with loading/error/cached states
- `RevenueAccountBalance` type in `src/lib/types/index.ts`
- `revenueApi` export in `src/lib/api/index.ts`
- `RevenueBalanceCard` added to dashboard, reports, and payments pages
- `docs/revenue-split-balance/` — Full documentation (8 files)
