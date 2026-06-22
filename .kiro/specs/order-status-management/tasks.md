# Implementation Tasks

## Task 1: Add merchant order status action buttons to the merchant orders page

**File:** `frontend/app/merchant/orders/page.tsx`

Add status-action buttons to the expanded order detail panel based on the order's current status.

### Sub-tasks

- [x] 1.1 Define a `MERCHANT_ACTIONS` map that declares, for each actionable order status, the list of `{ label, targetStatus }` action buttons:
  - `PLACED` → `[{ label: "Confirm Order", targetStatus: "CONFIRMED" }, { label: "Cancel Order", targetStatus: "CANCELLED" }]`
  - `CONFIRMED` → `[{ label: "Start Preparing", targetStatus: "PREPARING" }, { label: "Cancel Order", targetStatus: "CANCELLED" }]`
  - All other statuses → no entry (no buttons shown)

- [x] 1.2 Add per-order in-flight state: a `Record<string, string | null>` called `updating` and a `Record<string, string>` called `orderErrors` to track inline errors per order.

- [x] 1.3 Implement `handleStatusUpdate(orderId: string, targetStatus: string)`:
  - Set `updating[orderId] = targetStatus`
  - Clear `orderErrors[orderId]`
  - Call `api.patch<{ status: string }>(\`/orders/${orderId}/status\`, { status: targetStatus })`
  - On success: update the matching order's `status` in the `orders` state array in-place (no re-fetch)
  - On error: set `orderErrors[orderId]` to the error message
  - Finally: clear `updating[orderId]`

- [x] 1.4 In the expanded detail panel render the action buttons:
  - Look up `MERCHANT_ACTIONS[order.status]`; if the array is non-empty, render a button row
  - Each button calls `handleStatusUpdate(order.id, action.targetStatus)` and is `disabled` while `updating[order.id]` is set
  - The primary action (first button) uses the `Button` component; "Cancel Order" uses a secondary/destructive style
  - If `orderErrors[order.id]` is set, render an inline `role="alert"` error message above the buttons

### Acceptance criteria

- A `PLACED` order shows "Confirm Order" and "Cancel Order" buttons
- A `CONFIRMED` order shows "Start Preparing" and "Cancel Order" buttons
- A `PREPARING` / `OUT_FOR_DELIVERY` / `DELIVERED` / `CANCELLED` order shows no action buttons
- Buttons are disabled while the API call is in flight
- Status badge updates in-place on success without page reload
- Inline error displayed per-order on failure; buttons re-enabled for retry
- All existing filter, expand/collapse, fetch, and display behavior is preserved
