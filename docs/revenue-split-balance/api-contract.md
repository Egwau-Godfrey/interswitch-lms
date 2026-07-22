# API Contract

## API Called

**Endpoint**: `GET /dashboard/revenue-balance`

**File**: `src/lib/api/revenue.ts`

```typescript
export const revenueApi = {
  getBalance: async (): Promise<RevenueAccountBalance> => {
    return apiClient.get<RevenueAccountBalance>('/dashboard/revenue-balance');
  },
};
```

**Hook**: `src/components/dashboard/use-revenue-balance.ts`

```typescript
export function useRevenueBalance(enabled: boolean = true) {
  const { status, isReady } = useApiAuth();
  const { data, isLoading, error, refetch, isRefetching } = useApi<RevenueAccountBalance>(
    () => revenueApi.getBalance(),
    [isReady],
    {
      enabled: enabled && status === "authenticated" && isReady,
      cacheKey: "dashboard-revenue-balance",
      refetchInterval: 5 * 60 * 1000, // 5 minutes
    },
  );
  return { balance: data?.balance ?? 0, revenueInfo: data, isLoading, error, refetch, isRefetching };
}
```

## Request

- **Method**: `GET`
- **URL**: `{NEXT_PUBLIC_API_BASE_URL}/dashboard/revenue-balance`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Query params**: None

## Response Type

```typescript
// src/lib/types/index.ts
export interface RevenueAccountBalance {
  balance: number;           // Total amount in the account
  commission: number;        // Commission component
  lien: number;              // Liens on the account
  name: string | null;       // Account name (e.g. "QRISCORP LENDING FEES")
  terminal_id: string | null; // Terminal ID (e.g. "8FLOATFE02")
  our_share: number;         // 70% of balance
  interswitch_share: number; // 30% of balance
  split_ratio: number;       // The ratio used (default 0.70)
  last_fetched_at: string | null; // ISO timestamp
  is_cached: boolean;        // Whether result came from backend cache
  error: string | null;      // Error message if fetch failed
}
```

## Example Success Response

```json
{
  "balance": 1250000.0,
  "commission": 12000.0,
  "lien": 0.0,
  "name": "QRISCORP LENDING FEES",
  "terminal_id": "8FLOATFE02",
  "our_share": 875000.0,
  "interswitch_share": 375000.0,
  "split_ratio": 0.70,
  "last_fetched_at": "2026-07-22T08:23:14+00:00",
  "is_cached": false,
  "error": null
}
```

## Errors the API Can Return

| HTTP Status | When | Body | Frontend Behavior |
|---|---|---|---|
| `200` | Always (even on Infinity API failure) | `RevenueAccountBalance` with `error` field set | Shows `"--"` with error message |
| `401` | JWT token expired or missing | Standard FastAPI error | Redirects to login page |
| `500` | Unhandled server error | Standard FastAPI error | Shows error state, retries on next 5-min refresh |
| Network timeout | Request takes too long | `useApi` error | Shows error state, retries on next refresh |

### Error in Response Body (HTTP 200)

When the Infinity API fails, the backend returns HTTP 200 with the `error` field set:

```json
{
  "balance": 0.0,
  "commission": 0.0,
  "lien": 0.0,
  "name": null,
  "terminal_id": null,
  "our_share": 0.0,
  "interswitch_share": 0.0,
  "split_ratio": 0.70,
  "last_fetched_at": null,
  "is_cached": false,
  "error": "Infinity API request timed out"
}
```

The card checks `revenueInfo?.error` and displays `"--"` with the error message.
