# Testing

## Test Strategy

Testing is primarily done through manual verification and the backend unit tests. The frontend component relies on the existing `useApi` hook which is already tested.

## Manual Test Cases

### 1. Loading State

- **Steps**: Open the dashboard page
- **Expected**: Card shows spinner and "Fetching revenue balance..." while the API call is in flight
- **Verify**: Card appears immediately (does not block other dashboard components)

### 2. Success State

- **Steps**: Wait for the API call to complete
- **Expected**: Card shows total balance, account name, terminal ID, 70/30 split breakdown, commission, and lien
- **Verify**: Currency formatting is correct (UGX prefix, comma separators)

### 3. Error State

- **Steps**: Stop the backend server, then refresh the dashboard
- **Expected**: Card shows `"--"` and "Failed to load revenue balance"
- **Verify**: Other dashboard components still load normally

### 4. Cached State

- **Steps**: Wait for the first successful load, then wait for the 5-minute auto-refresh
- **Expected**: "Cached" badge appears when data comes from the backend cache
- **Verify**: Badge disappears when a fresh API call is made

### 5. Manual Refresh

- **Steps**: Click the refresh button (↻) in the card header
- **Expected**: Spinner animates, data refreshes
- **Verify**: Button is disabled while refreshing

### 6. Auto-Refresh

- **Steps**: Leave the dashboard open for 5+ minutes
- **Expected**: Data refreshes automatically in the background
- **Verify**: No page reload or visible disruption

### 7. Responsive Layout

- **Steps**: Resize the browser window to mobile width
- **Expected**: Split breakdown boxes stack vertically
- **Verify**: All text remains readable

### 8. Multiple Pages

- **Steps**: Navigate to Dashboard, Reports, and Payments pages
- **Expected**: Revenue balance card appears on all three pages
- **Verify**: Each card loads independently (does not share state)

## Backend Tests

See the backend documentation at `isw-loans-api/docs/revenue-split-balance/testing.md` for unit tests covering:
- API response parsing
- Caching behavior
- Error handling
- Split calculation
- Schema validation
