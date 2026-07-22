# Component Design

## Card Layout

```
┌─────────────────────────────────────────────────────┐
│  Revenue Split Account              [Cached]  [↻] 💰 │
│                                                     │
│  UGX 1,250,000                                      │
│  QRISCORP LENDING FEES · 8FLOATFE02                 │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │ 📈 Our Share (70%)│  │ 📉 ISW Share (30%)│       │
│  │ UGX 875,000       │  │ UGX 375,000       │       │
│  └──────────────────┘  └──────────────────┘        │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  Commission: UGX 12,000  ·  Lien: UGX 0           │
│  Settled weekly by Interswitch                      │
└─────────────────────────────────────────────────────┘
```

## States

### Loading State

When `isLoading` is true:
- Shows a spinner (`Loader2` with `animate-spin`) and "Fetching revenue balance..." text
- Card border and gradient still visible

### Error State

When `error` is set or `revenueInfo?.error` is not null:
- Shows `"--"` as the balance value
- Shows "Failed to load revenue balance" as the description
- No split breakdown, commission, or lien shown

### Success State

When data is loaded successfully:
- **Total balance**: Large bold text with UGX currency formatting
- **Account name and terminal ID**: Small muted text below balance
- **Split breakdown**: Two colored boxes side-by-side (emerald for our share, blue for ISW share)
- **Commission and lien**: Small text with separator, below a top border
- **Settlement note**: "Settled weekly by Interswitch" at the bottom

### Cached State

When `is_cached` is true:
- Shows a "Cached" badge next to the title (with `BadgeCheck` icon)
- All data is still displayed normally

## Responsive Behavior

- **Desktop**: Split breakdown boxes are side-by-side (`grid-cols-2`)
- **Mobile**: Split breakdown boxes stack vertically (grid auto-collapses)
- The card spans the full width of its container

## Currency Formatting

Uses the shared `formatCurrency` function from `src/components/shared/stat-card.tsx`:

```typescript
formatCurrency(balance, "UGX", true)  // compact mode for large numbers
// UGX 1,250,000 → "UGX 1,250,000"
// UGX 12,500,000 → "UGX 12.50M" (compact)
```

## Color Scheme

| Element | Color |
|---|---|
| Card background | Amber gradient (`from-amber-50 to-yellow-50`) |
| Card border | Amber-100 |
| Icon badge | Amber-to-yellow gradient |
| Our share box | Emerald background and text |
| ISW share box | Blue background and text |
| Cached badge | Secondary (muted) |

## Icons

| Icon | Component | Usage |
|---|---|---|
| Building2 | `lucide-react` | Card header icon |
| TrendingUp | `lucide-react` | Our share indicator |
| TrendingDown | `lucide-react` | ISW share indicator |
| BadgeCheck | `lucide-react` | Cached badge |
| RefreshCw | `lucide-react` | Manual refresh button |
| Loader2 | `lucide-react` | Loading spinner |
