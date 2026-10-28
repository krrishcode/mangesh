# Vercel production deployment

Project: `mangesh-mahadev`, in the **Mangesh Mahadev** Vercel team.

The repository uses `.github/workflows/deploy.yml`: pushes to `main` and manual workflow dispatch run dependency installation, TypeScript and automated tests before deploying to Vercel production. Deployments are serialized. Node.js 22 and Vercel CLI 65.5.0 are pinned for consistent builds.

The supplied Vercel account does not have a GitHub Login Connection, so native Vercel Git integration cannot link the repository. GitHub Actions provides the automatic Git-to-Vercel deployment instead; do not enable both paths without deciding which should own production releases.

GitHub repository configuration:

- Secret `VERCEL_TOKEN` authorizes deployment.
- Variables `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` select the existing team and project.
- Application/database/SMTP credentials live in the Vercel project's encrypted **production** environment variables, not in the workflow or repository. Production credentials are not shared with preview builds.

Vercel uses the repository root, Next.js, `npm ci`, `npm run build` and the Frankfurt function region. `POSTGRES_URL`, `JWT_SECRET`, SMTP settings, support contact and HTTPS application origins are configured per deployment. Development OTP bypass is disabled. Database schema changes do not run during website builds; the additive email schema was applied separately.

The persistent email worker stays on the VPS. When the public site origin changes, update that worker with:

```bash
npm run mail:build
python scripts/deploy-email-worker.py --origin https://YOUR-PRODUCTION-HOST
```

Keep website and email origins consistent so password-reset, account and order links point to the deployed application. Custom-domain DNS changes are a separate operation; preserve the domain's email MX/SPF/DKIM/DMARC records.

For a failed deployment, inspect the GitHub Actions run and Vercel build logs before changing production. The existing launch-readiness report records remaining security/storage/schema-management work; a successful deployment does not remove those findings.
