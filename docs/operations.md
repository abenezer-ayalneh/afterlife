# Deployment and operations

## Configure isolated environments

Create separate staging and production D1 databases in the intended Cloudflare account. Replace each environment's placeholder database UUID in `wrangler.jsonc`; keep the default local binding isolated. Set the canonical HTTPS `PUBLIC_ORIGIN`, real `TURNSTILE_SITE_KEY`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, and one `ADMIN_EMAIL` for each environment. Set `TURNSTILE_SECRET_KEY` and a random `RATE_LIMIT_SALT` as Worker secrets in each environment. Never paste secret values into source code or chat.

Configure Cloudflare Access to cover the canonical host's `/admin` and `/admin/*`, including API routes. Enable emailed one-time codes; allow only the configured administrator email. The app also verifies Access's signed JWT server-side. Keep `workers_dev` and version preview URLs disabled, and test alternate addresses to ensure administrator requests fail.

Create separate Turnstile widgets for staging and production with their exact hostnames. Verify server-side success, hostname and action checks with fresh tokens. Try an expired/replayed token and verify rejection. Local bypass does not run in a built Worker.

Migrate the intended remote database only after its account, name, and environment are checked:

```sh
npx wrangler d1 migrations apply DB --remote --env staging
node scripts/preflight.mjs staging
npm run build:staging
npx wrangler deploy --dry-run
```

Astro's current Cloudflare adapter uses the Vite plugin: select the environment **at build time** with `CLOUDFLARE_ENV`, as the package scripts do. Deploy the resulting generated config; do not build one environment and retarget it with a deployment flag. See the [Astro adapter guide](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).

Publish the configured staging build for review through the authorized account workflow. Complete the real admin email login, Turnstile validation, mobile/desktop theme review, and all acceptance checks. After the user's launch approval, repeat packaging for production with `node scripts/preflight.mjs production` and `npm run build:production`; deploy that production build. Seed production through migrations only, without importing local or staging responses.

Verify HTTPS, headers, all nine chapter URLs, one rating and its revision, a comment and owner edit/delete, reporting/moderation, CSV exports, and admin denial without credentials. Remove launch-test data through an authorized maintenance procedure before accepting real responses. Generate a copyable link list using `scripts/chapter-links.mjs` with the final canonical origin.

## Database export and recovery

Administrator CSVs are analysis exports, not backups. Full SQL backups contain ownership hashes and private reports; store them encrypted with restricted access, outside source control. Define a retention period before launch and reflect it in the privacy notice.

```sh
npx wrangler d1 export DB --remote --env production --output /secure/path/afterlife-backup.sql
```

Restore to a newly created isolated recovery database first, using a separate Wrangler config that binds only that database:

```sh
npx wrangler d1 execute DB --remote --config /secure/path/recovery-wrangler.jsonc --file /secure/path/afterlife-backup.sql
```

Verify chapter IDs/titles, row counts, score aggregates, Unicode comments, and schema triggers before switching any live binding. A Worker-code rollback does not roll back D1 data. Use D1 Time Travel or a verified SQL backup for data recovery after checking the current supported recovery window. The repeatable local recovery check runs in isolated temporary directories via `node scripts/verify-recovery.mjs`; it never modifies the application database.

## Moderate comments

Open `/admin`, enter the emailed code, and review Reports. A report remains private and never hides its target automatically. Hide a comment to remove it from public pages, then mark its report reviewed. Restore returns a hidden comment to public pages. A reader-deleted comment's text/name are purged from active tables and cannot be restored here. Review hidden comments periodically. CSV comment exports include hidden comments and exclude deleted ones.

## Usage and service failures

Check Workers requests/CPU errors and D1 storage, rows read and rows written in the dashboard. Compare to the current [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) before launch and as readership grows. Avoid claiming free hosting will remain sufficient without measuring usage. No advertising analytics are installed.

The application limits each browser to fifteen submissions/minute and a salted network bucket to sixty/minute. D1 removes expired buckets on subsequent submissions. CSV snapshots expire after five minutes and are cleared after export or at the next export. Adjust limits only with observed traffic and re-run spam tests.

On a D1 outage, forms show a failure and preserve unsaved text. On a Turnstile outage, writes fail closed. Inspect structured Worker error events without logging comments, cookie values, JWTs or secrets. If Access cannot verify credentials, administration stays unavailable; public reader pages remain independent.
