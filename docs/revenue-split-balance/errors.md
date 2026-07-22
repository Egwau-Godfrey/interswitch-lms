# Error Handling

## Error States

### 1. API Returns Error in Response Body (HTTP 200)

**When**: The Infinity API fails (timeout, non-90000 code, network error, etc.)

**Backend behavior**: Returns HTTP 200 with `error` field set and `balance=0.0`

**Frontend behavior**:
- `revenueInfo?.error` is not null
- Card shows `"--"` as the balance value
- Shows "Failed to load revenue balance" as the description
- Split breakdown, commission, and lien are not shown

### 2. HTTP 401 Unauthorized

**When**: The JWT token has expired or is missing

**Backend behavior**: Returns standard FastAPI 401 error

**Frontend behavior**:
- `useApi` receives a 401 error
- The `useApiAuth` hook detects the expired session
- NextAuth redirects to the login page

### 3. HTTP 500 Internal Server Error

**When**: An unhandled exception occurs on the backend (should not happen due to try/except)

**Backend behavior**: Returns standard FastAPI 500 error

**Frontend behavior**:
- `error` is set in the hook
- Card shows `"--"` with error message
- Retries automatically on the next 5-minute refresh interval

### 4. Network Timeout

**When**: The request to the backend takes too long

**Frontend behavior**:
- `error` is set in the hook
- Card shows `"--"` with error message
- Retries automatically on the next 5-minute refresh interval

### 5. Empty/Null Response Data

**When**: The backend returns a valid response but with all fields at their defaults

**Frontend behavior**:
- `balance` is 0, `name` is null, `terminal_id` is null
- Card shows "UGX 0" with "QRISCORP LENDING FEES · 8FLOATFE02" (fallback values)
- This is unlikely to happen in practice but is handled gracefully

## Error Recovery

| Error Type | Recovery |
|---|---|
| Infinity API failure | Auto-retries on next 5-min refresh |
| 401 Unauthorized | Redirects to login; user re-authenticates |
| 500 Server error | Auto-retries on next 5-min refresh |
| Network timeout | Auto-retries on next 5-min refresh |
| Manual refresh | User clicks the ↻ button to retry immediately |

## Error Display

The card never shows raw error messages to the user. Instead:
- Balance shows `"--"`
- Description shows "Failed to load revenue balance"
- The actual error message is available in `revenueInfo?.error` for debugging but is not displayed
