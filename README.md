# An Afterlife for Atheists

Public chapter persuasiveness survey, built with Astro, TypeScript, native CSS, Node 22.19+ (or Node 24.21+) and SQLite. Eleven chapters use permanent `/chapters/1`–`/chapters/11` routes. User-selected composition B is implemented with original transparent ink illustrations and locally served licensed fonts.

## Local development

Use Node 22.19+ within Node 22, or Node 24.21+ within Node 24, and the committed npm lockfile. The existing VPS Node 22.19 is supported.

```sh
npm ci
npm run db:local
npm run dev
```

Open http://127.0.0.1:4321/. Ratings and comments persist in `.data/local.sqlite`. This is explicitly labeled local test data. Local submissions bypass Turnstile only in an Astro development build with `APP_ENV=local` on a loopback hostname. Built staging and production versions fail closed without real configuration. Copy `.env.example` to `.env` if you need to override local defaults. `/admin` has no development authentication bypass.

```sh
npm test
npm run build
```

Stop the development daemon with `npm exec astro dev stop` before running the production build; the framework check and running dev server share the Vite cache. Restart development after the build. `astro dev logs` reads daemon logs.

## Behavior

- Ratings accept integer 0–10 scores, with no initial selection. Database uniqueness, transactional receipts and optimistic versions make replacement and retries safe. Concurrent conflicting revisions return a recoverable conflict.
- Public aggregates include zero scores correctly; an empty chapter has no average.
- Comments are independent, plain text, public immediately, newest first, twenty per page. Browser ownership authorizes editing/deletion. Reporting never automatically hides a comment.
- Access JWTs are verified for signature, issuer, audience, expiry, type and either configured administrator email on every administrator request. Alternate deployment addresses cannot authorize administrator access.
- The administrator compares distributions, streams credential-free CSV snapshots, hides/restores comments, reviews reports, renames chapter titles and appends chapters. Reader-deleted text is purged from active tables and cannot be restored by moderation.

## Launch status

The repository is prepared for native Node under PM2, behind the existing Nginx on the GoDaddy Ubuntu VPS (`68.178.201.176`, 2 GB RAM). `https://afterlife.abenezer-ayalneh.dev` is the approved Cloudflare-proxied staging hostname. No remote configuration or deployment has been performed. Both authorized administrators have equal permissions. Real Access/Turnstile credentials and origin TLS must be supplied during setup.

Run `npm run build:staging`, then `npm run smoke` for the Node build. Runtime preflight is `node --env-file=/etc/afterlife/afterlife.env scripts/preflight.mjs staging`. Deployment, optional Docker maintenance tools, manual backup/recovery and rollback are documented in [docs/operations.md](docs/operations.md). There are no automated backups. Review the working staging site before launch; production starts with a separate clean database and final domain. Generate the eleven final book links after launch with `node scripts/chapter-links.mjs https://your-approved-domain`.

See [PRODUCT.md](PRODUCT.md), [CONTEXT.md](CONTEXT.md), [docs/development-plan.md](docs/development-plan.md), and [docs/design-review.md](docs/design-review.md). Historical generated mockups retain the earlier book title; all shipped text uses **An Afterlife for Atheists**.

## Vercel UI preview

Vercel uses `vercel.json` to run `node scripts/build-preview.mjs`. This generates static copies of the homepage, eleven chapter pages, privacy, and guidelines in `dist/`. The isolated build uses the official eleven chapter titles and empty results, excludes admin/API routes, and displays a preview message when a form is submitted. It does not connect to SQLite or save ratings/comments. The normal Astro build targets Node.
