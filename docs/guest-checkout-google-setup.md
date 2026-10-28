# Guest checkout and Google sign-in

> Historical record. The backend paths and commands in this document referred to
> the separate Hono service, which was removed on 2026-10-22. The code now lives
> in `src/server/`; use `.env.local` and run commands from the repository root.

The reference storefront's public login, product, cart and guest shipping flow were reviewed on 17 October 2026. Reference checkout goes straight to shipping with a sign-in option, contact and recipient details, an optional registration checkbox, and a product/price summary. It also shows phone verification. An initial browser DNS failure cleared on retry. Inspection of its authenticated panel is waiting for the owner's confirmation to accept the login screen's Terms of Use; the supplied credentials have not been submitted. Complete parity with that private panel has not been claimed.

The project keeps its blue palette, email/password authentication and COD payment as requested. Phone OTP verification, gift cards, saved online payment methods and PhonePe payments have not been enabled; they require their own provider and business configuration. No placeholder OTP, coupon or payment success is simulated.

## Available now

- Email/password signup, sign-in, password visibility and confirmation, password recovery screens, return to the intended account/checkout page.
- Guest checkout with contact details, delivery address or collection, server-priced COD order placement and a receipt. No dummy account is created. Existing email addresses do not cause guest purchases to attach to an account.
- Guest orders in this browser for 30 days, with order status, items, delivery address, shipment information and cancellation of pending unpaid COD orders. Access uses a random HttpOnly/SameSite cookie; only its hash is stored. Cookies must be retained. When cookie access is lost, customer care is the current recovery path.
- Explicitly add a guest purchase to a signed-in account using both the original browser receipt capability and account authentication.
- Account overview, order details/tracking/cancellation, wishlist, shipping/billing address book, contact details, measurements, appointments and sign-in security. All use backend data.
- Google Identity Services integration and server token verification. Disabled until the owner's Web OAuth Client ID is configured. No password from the reference website is used or saved in this project.
- Blue palette retained. Payment remains COD; PhonePe has not been activated.

## Enable Google

1. In Google Cloud Console, create/select a project. Open Google Auth Platform, complete Branding and Audience for this application.
2. Create an OAuth client of type **Web application**.
3. Under Authorized JavaScript origins, add `http://localhost`, `http://localhost:3000`, and your actual production HTTPS origin. Add production www/non-www origins separately if both serve login.
4. The implementation uses the JavaScript popup callback; an authorized redirect URI and client secret are not required for this flow. Only request basic identity scopes (openid, email, profile).
5. Add `GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com` to `.env.local`. Restart the Next.js server. The frontend reads the provider configuration from the same-origin API, so no duplicated public environment variable is needed.
6. If the consent application is in Testing, add your intended test accounts in Audience. Complete the production domain/privacy and branding requirements before publishing it.
7. Sign in from `/login` or `/register` and verify that the customer appears in `/account`, that signing out works, and that subsequent Google sign-in reopens the same account.

Google credentials are verified by Google's SDK for signature, issuer, audience and expiry, plus a browser-bound nonce and verified email. Stable Google subject IDs are stored separately. Password accounts auto-link only when Google currently controls their Gmail/Workspace mailbox; third-party email aliases must use the existing password. Administrator Google login is disabled. New Google accounts have no usable password; email recovery can establish one after SMTP is configured.

Official setup: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
Official token verification: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

## Database/deployment

Apply `npm run db:migrate:buyer` and then `npm run db:migrate:guest` from the repository root on other installations. The guest migration preserves existing records, makes order customer IDs nullable, and adds guest session, guest contact and Google identity tables. Applied to this installation without creating customer/order fixtures.

Set production `NODE_ENV=production`, a stable strong `JWT_SECRET`, `APP_ORIGIN`, HTTPS and working SMTP settings. Cookies are Secure in production. Rate limiting reads the first `x-forwarded-for` value; deploy behind Vercel or another trusted proxy that overwrites that header. Do not expose the Next.js server directly to clients on a non-Vercel host without one.

Google activation and real SMTP delivery require owner configuration. No live Google login, reset email, test customer or COD order was submitted to the configured database for verification. Automated checkout and authentication tests use isolated fixtures.

## Verification

- Backend: 87 isolated tests passed, including guest ownership, idempotency, stock rollback, cancellation, claiming and Google validation/creation.
- Frontend: 17 commerce regression tests passed. Both production builds passed.
- Live local UI: desktop/mobile auth and guest checkout inspected, password mismatch validation checked without submitting account data, home delivery/pickup switching checked. Shopping bag restored to its initially empty state afterward.
