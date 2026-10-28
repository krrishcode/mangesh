# Customer flow verification — 25 October 2026

Payment remains COD only. Home delivery uses cash on delivery; store pickup
uses payment at collection. No online gateway was added.

## Fixes

1. **Immediate sign-in after logout could fail.** Sessions issued in the same
   second used identical JWTs. Revoking the first also rejected a new login.
   Every newly issued token now carries a unique `jti`; older token verification
   remains compatible. A frozen-clock regression and real-database login/logout
   sequence cover this.
2. **Concurrent duplicate signup returned HTTP 500.** The email availability
   check could race another signup's insert. Database duplicate-key errors now
   return the same actionable 409 conflict as ordinary duplicate registrations.
   Driver and Drizzle-wrapped error shapes are covered; unrelated database
   errors still propagate.
3. **Product slug/SKU links returned 404.** Metadata supported those identifiers,
   but page rendering only searched numeric IDs. Rendering now uses the catalog
   lookup service. Numeric ID `8`, its slug, and SKU `MM-BDG-203` all returned
   HTTP 200 after the change.
4. **Fresh schema setup omitted extended product columns.** The storefront
   requires fields added by the existing idempotent product migration script.
   `npm run db:migrate` now runs that script after Drizzle migrations. Existing
   databases keep their current values; already present columns are skipped.

## Backend integration coverage

The real API dispatcher, authentication, validation, Drizzle queries and
transactions were exercised against an isolated local MariaDB database. Only
public catalog records were seeded from the running storefront. Customer and
order records were synthetic; existing remote customer/order data was not used
for mutation tests.

The reproducible `npm run test:customer-flows` runner covers 26 scenarios:

- Anonymous account access denial and customer/admin separation.
- Signup validation, successful signup/session, duplicate and concurrent signup.
- Correct/incorrect password login and email case normalization.
- Profile update, phone validation, measurement creation/update/clearing.
- Address creation/edit/deletion/default selection and ownership checks.
- Wishlist add/read/idempotence/removal.
- Appointment booking, read, rescheduling, cancellation, future-date validation,
  and ownership checks. Appointment timestamps were checked to database-second
  precision.
- Server-calculated quotes, unavailable variants, invalid quantities, duplicate
  bag lines, stale totals, foreign addresses and non-COD rejection.
- Member and guest COD orders: address/variant snapshots, pending payments,
  inventory deduction, safe retries, cancellation and one-time stock restoration.
- Guest receipt isolation between browsers and claiming an order into an account.
- Shipment/payment read ownership.
- Password change, old-session invalidation, reset-token consumption/reuse/expiry,
  logout revocation and immediate sign-in after logout.
- Unconfigured Google/recovery responses and cross-origin checkout rejection.
- Two simultaneous buyers competing for the last unit: one order succeeds, one
  receives a stock conflict, and stock never becomes negative.

The local MariaDB fixture needed explicit nullable timestamp handling to match
the application's MySQL schema. Its first historical migration also needed the
local SERIAL alias normalized to the current integer ID type. These were QA
fixture adaptations, not changes to historical production migrations.

## Browser verification

The running frontend at `http://localhost:3001` was exercised for:

- Invalid login feedback and password visibility.
- Signup confirmation mismatch and preservation of the checkout return URL.
- Account access gates on overview, orders, wishlist, addresses, profile and
  appointments, including the intended return URL.
- Catalog price sorting, category filtering and clearing filters.
- Product colour/size availability, add to bag and listing quick add.
- Quantity increase/decrease, price totals, live header bag counts and removal.
- Guest checkout with backend quotes, delivery/pickup switching, and COD/payment
  at collection wording. Test bag items were removed afterwards.
- Anonymous wishlist redirect to sign-in with the original shop return URL.
- Missing reset-token feedback and SMTP-unavailable recovery feedback.
- Header navigation/search/mobile checks recorded in the preceding header work.

No real order was submitted through the remote-connected storefront. The
checkout page did create its normal anonymous browser session. Existing users,
orders, product values and stock were not edited in the remote database.

## Verification limits

Automatic approval review rejected starting a separate QA web server, with only
`blocked by policy` supplied as the reason. Backend mutation tests therefore
called the real dispatcher directly against the local database; browser tests
used the running storefront for validation, catalog, bag and quotes. A successful
browser signup/login followed by committed member/guest orders against the
isolated database remains unverified. This report does not claim full browser
end-to-end checkout coverage.

Google OAuth and SMTP are not configured. Their disabled/unavailable states and
backend validation are covered; real Google sign-in and delivery of a recovery
email require working provider configuration. Contact links were inspected but
no WhatsApp messages, emails, or calls were sent.

## Commands and results

- `npm test`: 144/144 tests passed across 12 files.
- `npm run typecheck`: passed after the fixes.
- `npm run test:customer-flows`: 26/26 scenarios passed on the isolated database.
- HTTP smoke checks: 20/20 page/API URLs returned the expected status, including
  product ID/slug/SKU routes and missing product/category 404s.
- `npm run build`: passed, including TypeScript compilation.

The QA runner requires an explicit local database ending in `_qa`, creates
synthetic records, and produces `scratch/qa-backend-results.json`. It deliberately
does not read the application's remote database credentials.
