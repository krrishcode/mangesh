# Studio Admin UI integration

The store admin uses the neutral visual system from Studio Admin revision `51fb5d90e09b80f6c96b313a24b34c1514e3352b`: Geist typography, neutral colors, Lucide icons, collapsible sidebar, compact header, rounded cards, bordered tables, Radix action dropdowns and dialogs, and drawers for products/order/payment details.

All nine destinations remain under `/admin` and use the existing role-protected APIs. Products preserve variants, size availability, prices, gallery uploads, specifications and delivery choices. COD collection/refund workflows, category/review deletion policies, archive/restore and audit records remain connected.

Theme (light/dark/system), width preference and sidebar collapse persist under `mm-admin-ui-preferences`. These preferences and their CSS variables are scoped to the admin root, including modal/dropdown portals. Default is white/light. Storefront styles and customer authentication are separate.

The page search navigates actual store modules. Template destinations, sample users/account switching, fake exports and traffic/marketing analytics are excluded. Existing operational controls remain available through three-dot menus, with hover, pointer/touch and Radix keyboard navigation.

## Real overview data

`GET /api/account/admin/dashboard` additionally returns:

- `activity`: 30 complete IST dates with paid-collection totals and placed-order counts. Collections are grouped by the payment record's latest update, not a claimed historical settlement event. Refunded payment records are excluded.
- `orderStatuses`: counts from all orders, including archived operational records.
- `lowStockProducts`: active products at or below the configured threshold, up to five.
- `topProducts`: quantities and order value from non-cancelled order lines, up to five.
- `reviewSummary`: pending/approved/rejected counts.
- `generatedAt`: report generation time.

All-time collected revenue remains the sum of paid payment records and includes archived records. Charts do not invent historical data or traffic metrics. The activity selector switches between collection amounts and order counts.

## Verification

- Production `next build` passed, including TypeScript and static page generation.
- Six focused test files passed: 150 tests covering backend operations, checkout regressions, sessions, read lifecycle, table accessibility/status rules and report aggregation/IST boundaries.
- Inspected actual browser layouts at the desktop viewport and 390px mobile width. Verified light/dark theme, sidebar collapse, page search and mobile navigation.
- Loaded all nine modules using the authenticated browser session. Opened product, order and payment drawers with persisted data.
- Created a temporary inactive product (`UI-QA-20261025`) through the drawer, updated its price, verified the saved value and deleted only that temporary record through the guarded deletion form. No temporary product remains; its deletion audit is retained.
- Fixed a discovered product edit regression: serialized empty sizes (`"[]"`) no longer create a required empty legacy color variant when reopening a product with no variants.
- Confirmed mobile page/form widths do not overflow the viewport; tables retain their own horizontal scroll region.

Browser previews are saved in `artifacts/admin-ui/`. License attribution is in `THIRD_PARTY_NOTICES.md`.

## Module and calendar follow-up

The e-commerce overview now follows the reference dashboard's split KPI/chart panels, order activity, traffic-source analogue, top products, inventory, reviews and recent-order layout using live store records. Since visitor analytics and sales-channel metrics are not configured, the corresponding visual slots use actual order status/collection breakdowns rather than sample traffic figures.

Product tables expose real SKU, inventory, price and units sold. The appointments destination now defaults to a responsive FullCalendar month view with week/day/list modes, date navigation, status filtering, event detail, future-only rescheduling and a registered-customer appointment form. The existing list view and archive/restore lifecycle remain available. Added API writes are admin-protected and validated.

Current verification: seven focused test files pass (162 tests); `npm run typecheck` and `npm run build` pass. Desktop and 390px mobile calendar previews are saved in `artifacts/admin-ecommerce-match/`.
