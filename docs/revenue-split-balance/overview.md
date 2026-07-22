# Revenue Split Balance Card — Overview

> **Feature**: A dashboard card that displays the Interswitch revenue-split account balance (`8FLOATFE02`) with 70/30 split breakdown, commission, and lien.

## What It Shows

- **Total balance** in the revenue-split account (`8FLOATFE02` — "QRISCORP LENDING FEES")
- **Our 70% share** — the amount Interswitch will transfer to our main account at weekly settlement
- **Interswitch's 30% share** — their portion of the revenue
- **Commission** and **lien** on the account
- **Cached indicator** — shows when data is from the 5-minute cache
- **Account name and terminal ID**

## Where It Appears

| Page | File |
|---|---|
| Dashboard (super-admin) | `src/components/dashboard/dashboard-overview.tsx` |
| Dashboard (user) | Same component (shared via `DashboardOverview`) |
| Reports (super-admin + user) | `src/components/reports/report-summary-page.tsx` |
| Payments (super-admin) | `src/app/super-admin/payments/page.tsx` |
| Payments (user) | `src/app/user/payments/page.tsx` |

## Documentation Index

| Document | Description |
|---|---|
| [architecture.md](architecture.md) | Component tree, data flow, state management |
| [api-contract.md](api-contract.md) | What APIs are called, in what file, request/response, errors |
| [implementation.md](implementation.md) | Files created/modified, patterns used |
| [component-design.md](component-design.md) | Card layout, responsive behavior, loading/error states |
| [testing.md](testing.md) | Test cases and strategy |
| [errors.md](errors.md) | API errors, UI error states, resolution |
| [changelog.md](changelog.md) | Version history |

## Key Files

| File | Purpose |
|---|---|
| `src/lib/api/revenue.ts` | API service calling `GET /dashboard/revenue-balance` |
| `src/components/dashboard/use-revenue-balance.ts` | Data-fetching hook with 5-min auto-refresh |
| `src/components/dashboard/revenue-balance-card.tsx` | Card UI component |
| `src/lib/types/index.ts` | `RevenueAccountBalance` TypeScript type |
