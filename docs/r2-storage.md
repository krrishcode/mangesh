# Cloudflare R2 storage

Production website: https://mangeshmahadev.com. `www` redirects to the apex.
Vercel owns website TLS; Cloudflare DNS preserves Hostinger email records.

Bucket: `mangesh-mahadev`, with public custom domain
`https://cdn.mangeshmahadev.com`. The initial migration copied 187 images and
one video (66,228,248 bytes). Every R2 object was downloaded and SHA-256
verified before removing its local copy. No image was recompressed or altered.

The browser uploads directly to R2 with an admin-authorized signed PUT URL.
URLs expire after five minutes and bind the content type, length and cache
headers. The completion endpoint checks object metadata and the actual JPEG,
PNG or WebP signature. Only a completed upload can be attached to a product.
CORS permits the production, Vercel and local development origins.

## Deletion lifecycle

The additive SQL in `src/server/db/sql/20261029_media_storage.sql` creates the
asset registry, durable cleanup queue and product lifecycle trigger. Deleting
a product or removing/replacing its images queues old CDN URLs in the same
transaction. A rollback creates no cleanup job. Product deactivation retains
its images, and existing restrictions on deleting products with order/review
history still apply.

The `mangesh-media-worker` Docker container on the existing VPS polls every
15 seconds. It checks product references, historical order image snapshots
and protected website assets before deleting from R2 and purging the exact
CDN URL. Advisory locks prevent a new product reference from racing deletion.
Shared images remain until their last reference disappears. The 151 initial
website assets used outside the product catalogue are protected, including
product photographs used by homepage sections. Removed catalogue images that
are still used by those sections remain available there.

Abandoned uploads are collected after 24 hours. Temporary storage or purge
failures remain queued with exponential retries up to hourly. A restarted
worker resumes pending work; website request lifetime does not affect cleanup.
Only known product objects in this bucket are deleted. External image URLs
and protected website media are retained.

R2 credentials have Object Read & Write access to this bucket only. The VPS
worker has a separate zone-scoped Cache Purge token. The global Cloudflare
key is not included in application configuration or deployments. Production
credentials are not configured for preview deployments.

## Operations

```bash
python scripts/apply-media-schema.py
npm run media:build
python scripts/deploy-media-worker.py
```

The schema installer is explicit and additive. Do not run guarded Drizzle
schema commands until the imported PostgreSQL baseline is reconciled.
The deployment helper reads ignored `.env.local` and `.env.r2.local` files,
stores the worker environment in a root-only VPS directory, and starts a
restricted container with no public ports and `unless-stopped` restart policy.

Run `npm run test:media` to check signed uploads, shared-image protection,
replacement/deletion, CDN invalidation, rollback, retry and abandoned uploads.
It requires the isolated `mangesh_qa` schema with the media SQL applied using
`python scripts/apply-media-schema.py --schema mangesh_qa`. It creates only
synthetic QA records and unique temporary R2 objects, then removes them.

Legacy `/images/*`, `/videos/*` and nested `/products/<folder>/<file>` URLs
redirect to the CDN so older shopping-bag and order links keep working.
Operational migration evidence and removed scratch backups are kept outside
the project in `E:\project-backups\mangesh-mahadev\2026-10-29-r2-cutover`.
