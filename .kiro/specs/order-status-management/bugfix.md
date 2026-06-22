# Bugfix Requirements Document

## Introduction

Merchant users can view their incoming orders on the orders page (`/app/merchant/orders/page.tsx`), but there are no action buttons to advance an order through its lifecycle. The backend already exposes `PATCH /orders/:id/status` for merchants to set `CONFIRMED`, `PREPARING`, and `CANCELLED`, but the frontend never calls it. This means merchants are unable to confirm, start preparing, or cancel orders from the UI.

Note: The rider delivery detail page (`/app/rider/delivery/[id]/page.tsx`) was listed as missing in the original bug report but is already fully implemented with status action buttons. The fix scope is limited to the merchant orders page.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a merchant views an order with status `PLACED` THEN the system displays order details but no button to confirm or cancel the order.

1.2 WHEN a merchant views an order with status `CONFIRMED` THEN the system displays order details but no button to start preparing or cancel the order.

1.3 WHEN a merchant views an order with status `PREPARING` THEN the system displays order details but no button to mark any further progression.

1.4 WHEN a merchant expands any actionable order card THEN the system renders the detail panel without any interactive status-update controls.

### Expected Behavior (Correct)

2.1 WHEN a merchant views an order with status `PLACED` THEN the system SHALL display a "Confirm Order" button (maps to target status `CONFIRMED`) and a "Cancel Order" button (maps to target status `CANCELLED`) in the expanded detail panel.

2.2 WHEN a merchant clicks "Confirm Order" or "Cancel Order" on a `PLACED` order THEN the system SHALL call `PATCH /orders/:id/status` with the mapped target status, disable both buttons while the request is in-flight, and on success update the order's status badge to the new status and remove the action buttons for the previous status without a full page reload.

2.3 WHEN the status-update API call for a `PLACED` order fails THEN the system SHALL display an inline error message within that order's expanded detail panel and re-enable the action buttons so the merchant can retry.

2.4 WHEN a merchant views an order with status `CONFIRMED` THEN the system SHALL display a "Start Preparing" button (maps to target status `PREPARING`) and a "Cancel Order" button (maps to target status `CANCELLED`) in the expanded detail panel.

2.5 WHEN a merchant clicks "Start Preparing" or "Cancel Order" on a `CONFIRMED` order THEN the system SHALL call `PATCH /orders/:id/status` with the mapped target status, disable both buttons while the request is in-flight, and on success update the order's status badge to the new status and remove the action buttons for the previous status without a full page reload.

2.6 WHEN a merchant views an order with status `PREPARING` THEN the system SHALL display no merchant-action buttons in the expanded detail panel (the order is now awaiting rider pickup).

2.7 WHEN an order has status `OUT_FOR_DELIVERY`, `DELIVERED`, or `CANCELLED` THEN the system SHALL display the order details without any action buttons (these statuses are not merchant-actionable).

2.8 WHEN the status-update API call for a `CONFIRMED` order fails THEN the system SHALL display an inline error message within that order's expanded detail panel and re-enable the action buttons so the merchant can retry.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a merchant views orders THEN the system SHALL CONTINUE TO fetch and display orders from `GET /merchant/orders` on page load.

3.2 WHEN a merchant uses the status filter bar THEN the system SHALL CONTINUE TO filter the displayed orders by the selected status.

3.3 WHEN a merchant clicks an order card header THEN the system SHALL CONTINUE TO toggle the expanded detail panel open and closed.

3.4 WHEN an order has status `OUT_FOR_DELIVERY`, `DELIVERED`, or `CANCELLED` THEN the system SHALL CONTINUE TO display the order details without any action buttons (these statuses are not merchant-actionable).

3.5 WHEN a merchant views customer contact details or the item list in an expanded order THEN the system SHALL CONTINUE TO display that information correctly alongside the new action buttons.
