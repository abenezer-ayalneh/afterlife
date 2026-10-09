# Verification record

Verified locally on 2026-10-09. The user approved the mockups on this date. Public staging and production have not been provisioned or approved for launch.

## Automated checks — native VPS migration

- `npm run check`: Astro diagnostics passed with zero errors, warnings or hints.
- `npm test`: 22 tests passed against actual isolated SQLite databases. Coverage includes migrations/reruns/rollback, rating boundaries/conflicts/retries, transaction rollback, comment ownership/Unicode/pagination, reports/moderation, immutable chapter addresses, CSV escaping/snapshots, both local administrator identities, password/session validation, logout and reset revocation, deployment configuration, canonical proxy headers, secure cookies, network limits and signed form/honeypot failures.
- `npm run build:staging`: standalone Node build passed for the staging hostname.
- `npm run smoke`: the built Node server passed local HTTP checks for all eleven chapters, health, privacy/guidelines, static assets, HTTPS reconstruction, secure cookies, hostile proxy headers, unauthorized admin/API denial, missing/tampered local form tokens, and persistent rating/comment mutations. The smoke test exercises both local account logins, chapter management, credential-free CSV exports and logout without an external authentication or challenge service.
- `npm run verify:recovery`: isolated SQLite backup/restore preserved schema, migration ledger, chapters, ratings, Unicode comments and chapter immutability. Application data was untouched.
- `npm run package:release`: created the native deployment archive without secrets or response data.
- `node scripts/build-preview.mjs`: isolated Vercel static preview built all eleven chapter pages. It remains disconnected from the live database and submissions.
- Optional Docker tools build attempted locally but Docker Hub authorization failed with a DNS timeout for `auth.docker.io`. The Docker utility image is supplied but not verified. Nginx is not installed locally; its supplied configuration must pass `nginx -t` on the actual VPS before reload. PM2 startup and live origin trust must also be verified there.
- No remote configuration, cloud provisioning or deployment was performed. Existing design-review records below remain separate from the migration checks.

## Browser evidence

The implementation was captured on desktop, at 1280px, at 390px, and at 320px in the supported themes. Empty chapter pages show no selected score and “No ratings yet.” All eleven rating choices fit at 320px without horizontal scrolling. Accessible snapshots expose the survey question, radio labels, distribution values, form labels, and chapter navigation.

Local browser submissions confirmed that score zero persists, revision to ten keeps one response, and a separate Unicode comment persists after reload. Editing that comment saved successfully. A subsequent rating update retained the smaller `/ 10` unit and one response. These entries remain labeled development data and will not be imported into production.

## Design review

The independent Impeccable reviewer scored five visual/state findings resolved after two correction batches. The complete viewport scores approximately 92% against composition B. Its measured hero gate remains open for a footer-separator position reading; the original surface-seed receipt is unavailable and remains an honest provenance limitation. Subsequent workflow phases are not marked complete or forcibly advanced. See `.impeccable/review/finish-review.md` and `.impeccable/build/state.json`. Final disposition: `fix`, limited to these outstanding workflow findings. `DESIGN.md` and `.impeccable/design.json` document the implemented system.

The last screenshot batch exposed three invalid browser full-page stitched images; they were replaced with direct captures before final review. Desktop homepage comparison is 1536×1024, additional desktop is 1280×1040, and the normal 1101px viewport is recorded separately. Chapter and mobile full-page captures were valid.

## Required staging checks

The temporary staging hostname is `afterlife.abenezer-ayalneh.dev`, DNS-only to the GoDaddy Ubuntu VPS. Complete docs/operations.md: initialize both equal local administrator accounts, Certbot TLS, direct Nginx proxying, the loopback Node port, native PM2 runtime and reboot persistence. Verify both password logins, password reset/session revocation, management flows, signed forms/honeypots, canonical host denial, operational limits, and mobile/desktop accessibility. Validate the Nginx configuration and Certbot renewal on the VPS. These local checks do not establish WCAG conformance or production readiness. Obtain the user's working-site approval before production publication; production starts with a separate clean database and final domain.

## Spacing and theme refinement

The three requested changes were verified on desktop in both themes, at 390px mobile width, and on a 320px chapter header. Row minimum heights doubled to 90px/124px; measured title-center offsets were zero apart from subpixel rounding. Footer gaps are 84px/64px. All icon targets are 44px square. Keyboard activation, persisted Dark selection after reload, and System preference matching the operating-system theme were checked. No horizontal overflow was observed at these widths. The mobile footer was captured separately in `spacing-mobile-footer.png`; the mobile top captures are viewport evidence, not full-page images.

The final application build passed with zero errors, warnings, or hints. The detector reports only existing advisory typography-token differences; no blocking findings. Separate refinement reviewer and documenter agents stopped at an account usage limit, so the scoped finish review and design-record update were completed directly. See `.impeccable/review/spacing-finish-review.md`. Previously documented full-build gates and staging requirements remain open.

## Official eleven chapters — 2026-10-09

The official titles and ordering are recorded in PRODUCT.md. Migration 0004 was applied successfully to the local D1 database. An isolated SQLite migration check confirmed eleven chapter records and preservation of existing ratings and comments. The static preview build generated all eleven chapter pages; generated HTML checks verified every title, homepage link, and previous/next link. The book-link generator outputs all eleven named routes.

At the chapter-update checkpoint, the full integration suite and Astro check could not run: concurrent dependency changes removed Miniflare, Wrangler, and the Cloudflare adapter. The local migration ran using an isolated npx Wrangler invocation. No remote migration or deployment was performed. The native migration checks above supersede that earlier tooling limitation.

## Minimal deployment checklist revision

Node 22.19 was verified with all 22 tests and the built-server smoke checks; its SQLite experimental warning is expected. The package accepts Node 22.19+ in Node 22 and Node 24.21+ in Node 24. The deployment guide now uses a numbered checklist, the existing deployment account/PM2 installation, and Certbot-issued Let's Encrypt certificates. Nginx includes both an HTTP certificate bootstrap and a final HTTPS proxy with persistent challenge paths. No VPS configuration or certificate issuance was performed; live `nginx -t` and Certbot renewal checks remain required.

The deployment paths now match the existing server checkout at `/home/richard/afterlife`: `.env.staging`, `.data/staging.sqlite`, `.logs/`, and the checked-in PM2/Nginx source configs live there. Nginx's system include directories use symlinks into `deploy/nginx/`; Certbot certificates and the public challenge webroot retain their normal system paths. PM2 template syntax and path consistency were checked locally; no server files were changed.

## Local authentication and spam protection

The application now runs without Cloudflare Access or Turnstile. Both equal administrators use separate email/password accounts, hashed SQLite sessions, and server-command password resets. The interactive password command was verified with hidden input against a disposable database. Deployment readiness and startup reject missing administrator accounts. Local spam protection uses signed owner/action tokens, a honeypot, form age, and reader/network limits; it reduces spam without proving human identity. The updated suite and built-server smoke test passed under the exact VPS Node 22.19 runtime. The static preview and updated standalone staging build passed, and the release archive includes the authentication migration and password CLI without secrets or response data. Live Nginx, Certbot and PM2 checks remain required on the VPS.
