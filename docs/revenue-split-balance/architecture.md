# Architecture

## Component Tree

```
DashboardOverview (dashboard-overview.tsx)
  ├── KpiCardsRow
  ├── RevenueBalanceCard (revenue-balance-card.tsx)    ← NEW
  │     └── useRevenueBalance (use-revenue-balance.ts)
  │           └── useApi<RevenueAccountBalance>
  │                 └── revenueApi.getBalance() (revenue.ts)
  │                       └── apiClient.get('/dashboard/revenue-balance')
  │                             └── GET /dashboard/revenue-balance (backend)
  ├── ModelPerformanceWidget
  ├── CollectionsBreakdownCard
  ├── RevenueSplitCard
  └── ... (charts, widgets)
```

## Data Flow

```
1. DashboardOverview renders <RevenueBalanceCard />
2. RevenueBalanceCard calls useRevenueBalance() hook
3. useRevenueBalance calls useApi(() => revenueApi.getBalance(), ...)
4. useApi checks in-memory + sessionStorage cache (2-min TTL)
5. If cache miss → apiClient.get('/dashboard/revenue-balance')
6. apiClient adds Authorization: Bearer <token> header
7. Backend receives request → calls Infinity API → returns RevenueAccountBalance
8. useApi caches result and returns to hook
9. Hook returns { balance, revenueInfo, isLoading, error, refetch, isRefetching }
10. RevenueBalanceCard renders the data
11. After 5 minutes, useApi refetchInterval triggers a background refresh
```

## State Management

The hook uses the existing `useApi<T>` generic hook which provides:

- **In-memory + sessionStorage caching** (2-minute TTL on the frontend)
- **Background revalidation** (stale-while-revalidate pattern)
- **Token wait** — waits up to 3 seconds for the auth token before fetching
- **Refetch intervals** — 5-minute auto-refresh for revenue balance
- **Cache invalidation** via `invalidateCache(key)` with wildcard prefix support

## Auth Token Bridge

The `useApiAuth` hook syncs the NextAuth session token into the `apiClient` singleton:

```
NextAuth session → useApiAuth → apiClient.setAccessToken(token) → Bearer header
```

The revenue balance endpoint requires authentication (same `require_auth` as all dashboard endpoints).

## Non-Blocking Pattern

The `RevenueBalanceCard` loads **independently** from the main dashboard overview data. The dashboard renders instantly with KPI cards, and the revenue card fills in when the Infinity API responds. This is the same pattern used by the existing `WalletCard`.

## Caching Layers

| Layer | TTL | Storage | Purpose |
|---|---|---|---|
| Frontend `useApi` cache | 2 minutes | In-memory + sessionStorage | Avoid redundant calls within a session |
| Frontend refetch interval | 5 minutes | Timer | Auto-refresh stale data |
| Backend Infinity API cache | 5 minutes | In-memory Python dict | Avoid hammering the external Infinity API |
