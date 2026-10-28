# Launch readiness — 28 October 2026

Historical snapshot from 28 October 2026; see subsequent deployment updates below.

Update: Hostinger SMTP has since been configured and verified, including real inbox delivery and a persistent notification worker. See [transactional email setup](email-setup-2026-10-28.md). The SMTP finding below records the state at the original check; the other launch findings still need review.

29 October update: production is deployed with CI/CD on Vercel and the HTTPS
origin is `https://mangeshmahadev.com`. R2 replaces Vercel Blob for uploads and
CDN delivery, with a durable cleanup worker; see [storage operations](r2-storage.md).
Removing the unused Blob dependency reduced the current production npm audit
to the existing Zod advisory. The weak admin password, shared rate limiting,
verified database restore and imported Drizzle baseline remain open items.

## Verified

- A fresh production build succeeds after replacing the obsolete MySQL external-package entry with `pg` in Next.js configuration.
- The PostgreSQL connection reaches database `mangesh`, schema `public`, with TLS enabled and 25 product records.
- A local production server serves `/`, `/shop`, `/checkout`, `/account`, `/admin` and `/api/catalog` with HTTP 200. The protected admin API returns HTTP 401 without authentication. Security headers are present.
- The preceding verification run passed 257 automated tests, 26 isolated PostgreSQL customer checks and 7 isolated PostgreSQL admin/OTP checks. Those integration checks use synthetic records in `mangesh_qa`; they do not establish public-domain browser readiness.
- Active application source and runtime dependency configuration use PostgreSQL. The remaining historical source-database materials are archived outside the active application.

## Launch blockers found

1. SMTP is absent. In actual production mode, `POST /api/account/auth/otp/request` returns HTTP 503. Customer email sign-in/signup and password recovery need a configured sender and successful delivery checks. The development OTP override is correctly disabled by production mode.
2. `APP_ORIGIN` is still `http://localhost:3000`. Configure the real HTTPS origin in the deployment environment, and verify domain, certificates, recovery links, sitemap and origin checks on that deployment.
3. The single admin account still matches the weak password previously requested in this chat. Replace it with a strong unique password before public access. No password or hash is stored in the readiness report.
4. A fresh `npm audit --omit=dev` reports four high-severity package findings: `zod` and the `@vercel/blob` / `@vercel/oidc` / `@vercel/cli-config` dependency chain. The root advisory reported is GHSA-mrhx-c7xc-m3w5. This is an audit finding, not proof that every route is exploitable. Resolve it with a reviewed dependency update and regression checks before launch; the audit's suggested fix crosses package versions and was not automatically applied.

## Operational work and conditional features

- PostgreSQL's imported schema still has no reconciled Drizzle migration baseline. Schema-changing commands remain guarded. Existing runtime queries work, but the migration workflow needs reconciliation before future schema changes.
- Automated database backup and restore recovery have not been verified in this check.
- Vercel Blob credentials are absent, so admin product-image uploads remain unavailable until configured, or until another storage implementation is supplied.
- Shared Upstash rate limiting is absent. The application has an in-memory fallback; configure a shared store before running multiple independent instances.
- Configure deployment secrets separately. This check did not deploy the project, inspect every other running deployment, or verify every flow in a public-domain browser.

Evidence: `artifacts/launch-readiness/production-smoke.json`. Production dependency audit was obtained on the same date. Production smoke checks did not create orders or alter existing user passwords.
