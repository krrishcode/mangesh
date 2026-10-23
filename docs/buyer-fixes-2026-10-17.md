# Buyer fixes and COD checkout

> Historical record. The backend paths in this document (`hono/...`) were moved
> into `src/server/...` and the separate Hono service was removed on 2026-10-22.
> Run all commands from the repository root and use `.env.local`.

Date: 17 October 2026 (Asia/Kolkata)

## Current behavior

- The storefront reads the backend's active catalogue. Local/demo product arrays, demo seed scripts, fabricated product attributes/stock and demo administrator autofill have been removed.
- Homepage categories, featured products, shop, search, category pages, related products and the bag use database catalogue data. At verification, the shop showed the same 24 active products returned by the API.
- Checkout supports **Cash on Delivery**, or payment at collection when the products support pickup. PhonePe online payment is a future integration, as requested; no online payment is represented as completed.
- A signed-in buyer can select/add a delivery address, review a server-calculated total, place an order and view its confirmation/history. Order lines preserve size/colour and the delivery address is snapshotted.
- Order placement locks stock and creates the order, line snapshots and a pending COD payment in one transaction. Repeated submissions with the same request ID return the original order. Changed totals require the buyer to review again.
- Eligible pending COD orders can be cancelled; stock is restored once. Payment collection and cancellation serialize on the same parent order, so a cancelled order cannot be reopened by a collection.
- Both local services are running: frontend on port 3000 and backend on port 4000.

## Audit issue status

| Audit ID | Resolution |
| --- | --- |
| B01 | Anonymous payment recording is closed. Customer tokens cannot record payments. Manual collections require admin access, valid amounts/order state and a transaction. |
| B02 | Forgot-password never returns a recovery secret in any environment. Secrets are passed only to the configured SMTP transport. |
| B03 | Appointment ownership is checked before updating and when reading the result. Foreign IDs return 404 without disclosing notes. |
| B04 | Payments and shipping require authentication and parent-order ownership; administrative global access requires the admin role. |
| B05 | Uploads require an administrator, bounded request/file sizes and validated JPEG/PNG/WebP signatures. Random generated filenames and safe image extensions replace uploaded names. |
| B06 | Replaced the alert-only checkout with authenticated, server-validated COD order placement, address/variant snapshots, idempotency, confirmation and account history. |
| B07 | Shop hearts load/save/remove through the account wishlist API. Guests are sent to sign-in with a safe return path. Failed requests do not show a false saved state and can be retried. |
| B08 | Cart line identity includes product, colour and size. Adding, removing and changing quantity act on the correct variant. |
| B09 | Listing, search, product detail, featured products and quick add share effective sale pricing. Checkout independently calculates the payable amount. |
| B10 | Actual aggregate stock and available sizes are retained. The bag enforces product totals across variants. The server revalidates stock and guards its deduction transactionally. |
| B11 | Removed local product fallback/merging and product seed fixtures. Database failures return an error instead of a successful fake/empty catalogue. The product editor no longer invents images, silk composition, measurements, sizes or stock. |
| B12 | Catalogue reads use no-store. Product and category routes resolve at request time, so new records do not need a new frontend build. |
| B13 | SMTP recovery delivery and honest failure handling are implemented. **Live email delivery still requires SMTP settings**; current missing configuration returns 503 rather than falsely claiming an email was sent. |
| B14 | Sessions are bound to the current password hash and database identity. Password changes invalidate older sessions. Recovery consumes outstanding reset tokens atomically. Sign-out records server-side session revocation. |
| B15 | Missing/foreign mutations are distinguished from successful changes. Affected-row checks and explicit owned-record queries replace truthiness checks on MySQL result headers. |
| B16 | Address writes serialize on the user, verify ownership first and clear/set the correct default in one transaction. Editing a default preserves its flag even when the patch omits it. |
| B17 | Create, update and reschedule validate future appointment dates on the server. |
| B18 | Categories use database slugs and dynamic resolution. The existing Bottoms category and product breadcrumb now return 200. |
| B19 | Authentication fields have associated labels and autocomplete attributes. |
| B20 | Removed unsupported footer/policy/gift-card/social placeholders and page-relative dead anchors. Footer links now lead to supported destinations and actual contact channels. No business policy text was invented. |
| B21 | Removed the nonfunctional newsletter form. No subscription success is implied. |
| B22 | Public product detail requires an active product. Inactive product editing uses a separate admin-authorized detail route. |
| B23 | A manually entered recovery token remains editable after the first character; URL-provided tokens follow a separate state flag. |

## Additional cleanup

- Added an account change-password form and safe login return navigation, including checkout return after authentication.
- Order details include variant choices, delivery snapshot and available shipment information.
- Removed placeholder cart/inventory health routes that incorrectly reported successful modules. The bag remains browser-persisted; stock is managed through products and validated at checkout.
- Existing legacy bag items are retained for review with unknown variants marked unavailable, instead of inventing a size or silently discarding them.
- Removed old seeding/provisioning scripts containing fixed accounts and database credentials. Administrator creation now requires explicit environment values and does not overwrite existing accounts.
- Updated vulnerable dependencies, including Next.js, image processing and test tooling. The dependency audit reports zero known vulnerabilities in both packages at verification.
- Added same-origin account/admin API forwarding, with a route/method allowlist, bounded bodies, authentication forwarding and no-store responses. Uploads carry the administrator's token.
- Applied additive tables for checkout snapshots, order item variants and revoked sessions. No existing products, customers or orders were seeded/deleted by this migration.

## Verification

- Backend build passed and **63 backend tests passed**.
- Frontend production build passed and **17 frontend tests passed**.
- Both package dependency audits reported **0 vulnerabilities**.
- HTTP checks: frontend and backend respond; public catalogue works; anonymous payment and shipment requests return 401; Bottoms category returns 200.
- Live browser checks: 24 catalogue cards, consistent sale price, separate size 38/40 bag lines, checkout-to-login return path, anonymous wishlist sign-in flow, accessible login labels, manual reset-token editing and mobile bag width.
- Isolated component browser preview: home/pickup switching, add/select address, mobile layout, COD summary and simulated order confirmation. The preview used synthetic customer/address data and in-memory orders; it never called live mutation endpoints.
- Unit/regression scenarios include ownership checks, no-op mutations, default addresses, past dates, SMTP failure, reset-token consumption, variant stock limits, price tampering, changed totals, duplicate checkout requests, guarded stock failure, cancellation/restoration and cancelled-order payment rejection.
- Browser test bag additions were removed afterwards, restoring its initially empty state. Temporary preview tabs/server were closed/stopped.

No real customer order, payment, password, booking or address was changed for testing. A live customer checkout/payment collection was not performed against the remote database.

## Configuration and remaining external actions

1. **SMTP:** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` and the correct `APP_ORIGIN` in `.env.local`, then verify delivery with an authorized test recipient. The example file documents these keys. Missing SMTP configuration deliberately leaves email recovery unavailable.
2. **Credential rotation:** database credentials previously embedded in tracked utility scripts have been removed from current source. They may remain in Git history; the account owner should rotate those credentials with the database host and update the local/deployment environment. Existing admin credentials should also be rotated if any previously published demo account remains in the database. No account was silently deleted or changed.
3. **PhonePe:** COD is the only checkout payment option for now. PhonePe initiation, authenticated callbacks, provider-side verification, reconciliation and refunds need their own integration and sandbox verification when gateway credentials are available.

COD defaults to enabled and the previous zero delivery charge is preserved as configurable `SHIPPING_FEE_INR=0`. Configure the intended delivery charge before launch. New installations should run migrations; existing installations can use `npm run db:migrate:buyer` from the repository root for these additive tables.

The original audit remains a historical record. Its temporary scratch diagnostics reproduced the old defects; the project regression tests now assert the corrected behavior. Changes are local and have not been pushed in this task.
