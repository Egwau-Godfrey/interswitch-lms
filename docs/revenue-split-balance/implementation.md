# Implementation

## Files Created

| File | Purpose |
|---|---|
| `src/lib/api/revenue.ts` | API service calling `GET /dashboard/revenue-balance` |
| `src/components/dashboard/use-revenue-balance.ts` | Data-fetching hook with 5-min auto-refresh |
| `src/components/dashboard/revenue-balance-card.tsx` | Card UI component with loading/error/cached states |
| `docs/revenue-split-balance/` | This documentation folder |

## Files Modified

| File | Change |
|---|---|
| `src/lib/types/index.ts` | Added `RevenueAccountBalance` interface |
| `src/lib/api/index.ts` | Exported `revenueApi` |
| `src/components/dashboard/dashboard-overview.tsx` | Added `RevenueBalanceCard` import + render after KPI cards |
| `src/components/reports/report-summary-page.tsx` | Added `RevenueBalanceCard` after header |
| `src/app/super-admin/payments/page.tsx` | Added `RevenueBalanceCard` after summary cards |
| `src/app/user/payments/page.tsx` | Added `RevenueBalanceCard` after summary cards |

## Patterns Used

### 1. Service Layer Pattern

The API service is a simple object with async methods, following the existing pattern (`dashboardApi`, `paymentsApi`, etc.):

```typescript
export const revenueApi = {
  getBalance: async (): Promise<RevenueAccountBalance> => {
    return apiClient.get<RevenueAccountBalance>('/dashboard/revenue-balance');
  },
};
```

### 2. useApi Hook Pattern

The hook mirrors `useWalletBalance` — uses the generic `useApi<T>` hook with caching, auto-refresh, and auth token waiting:

```typescript
const { data, isLoading, error, refetch, isRefetching } = useApi<RevenueAccountBalance>(
  () => revenueApi.getBalance(),
  [isReady],
  {
    enabled: enabled && status === "authenticated" && isReady,
    cacheKey: "dashboard-revenue-balance",
    refetchInterval: REVENUE_REFRESH_INTERVAL,
  },
);
```

### 3. Card Component Pattern

The card follows the same visual style as the existing `WalletCard` — gradient background, icon badge, loading/error/success states. It uses the shared `Card`, `CardHeader`, `CardTitle`, `CardContent` components from `src/components/ui/card`.

### 4. Non-Blocking Pattern

The card loads independently from the main dashboard data. The `DashboardOverview` component renders the card without passing any props — the card fetches its own data via the `useRevenueBalance` hook.

## Where the Card Appears

| Location | File | Placement |
|---|---|---|
| Dashboard | `dashboard-overview.tsx` | After KPI cards, before Model Performance widget |
| Reports | `report-summary-page.tsx` | After header, before filter card |
| Payments (super-admin) | `super-admin/payments/page.tsx` | After summary cards, before filters |
| Payments (user) | `user/payments/page.tsx` | After summary cards, before filters |
