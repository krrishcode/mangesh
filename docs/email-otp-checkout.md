# Email OTP account access

The checkout Sign in button opens a native dialog. Login and registration pages use the same email form, with no Google button or password fields. Admin password login remains available.

1. Enter an email and accept the linked Terms of Use / Privacy Policy.
2. An existing customer sees the OTP field. A new customer also enters first and last names and can optionally subscribe to the newsletter.
3. Submit the six-digit code to log in or create the account. Checkout stays on the same URL, preserving bag, delivery method and the current address draft.

## Configuration

The migrated PostgreSQL database already contains the OTP and consent tables. Before applying future schema changes or setting up a fresh database, reconcile the PostgreSQL migration baseline as described in [the cutover notes](postgresql-cutover-2026-10-28.md).

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` and, where required, `SMTP_USER` / `SMTP_PASSWORD`. Set `APP_ORIGIN` to the store URL. Configured SMTP automatically enables real emailed codes. Codes expire after 10 minutes, are single use, and allow five incorrect attempts. Resending has a 60-second cooldown. Codes are HMAC hashed and bound to the initiating browser through an HttpOnly cookie. Customer OTP cannot sign into admin accounts.

For local development without SMTP only, `AUTH_OTP_DEV_BYPASS=true` accepts any six numeric digits on localhost / loopback requests. The UI explicitly describes this preview mode. The flag is ignored in production and when SMTP is configured. Production without SMTP returns an unavailable response; it never accepts arbitrary codes. The committed environment example defaults the flag to false.

Terms and Privacy pages are `/terms-and-conditions` and `/privacy-policy`, linked from the email form and the footer. They use original wording about this store's current email authentication, COD, home delivery, pickup, appointments and measurements. New-account terms acceptance and optional newsletter preference are stored in `customer_auth_consents`; there is no connected newsletter sending service yet.

## Verification — 25 October 2026

- 170 automated tests passed, including 26 OTP cases for expiry, replay rejection, browser binding, attempt limits, consent, role checks, provider errors, cooldown, signup and development/production boundaries.
- Typecheck and production build passed.
- Live development browser: new synthetic account created and logged in on the same checkout; bag, total, home delivery and typed address preserved. Existing member logged in with OTP while store pickup stayed selected. No order was submitted. Stored consent was checked against the database and the synthetic account / its challenges were removed after sign-out.
- Mobile checks at 375px: dialog remains within the viewport and scrolls for longer forms; legal pages have no horizontal overflow. Native dialog focus, close and step-change focus were inspected.
- Actual SMTP delivery is pending credentials. Email sending success/failure and real-code verification are covered by mocked provider tests, not a live mailbox delivery test.
