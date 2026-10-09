# An Afterlife for Atheists

Public chapter persuasiveness survey, built with Astro, TypeScript, native CSS, Cloudflare Workers and D1. Nine seeded chapters use permanent `/chapters/1`–`/chapters/9` routes. User-selected composition B is implemented with original transparent ink illustrations and locally served licensed fonts.

## Local development

Use Node 24 and the committed npm lockfile.

```sh
npm ci
npm run types
npm run db:local
npm run dev
```

Open http://127.0.0.1:4321/. Ratings and comments persist in `.wrangler/state/`. This is explicitly labeled local test data. Local submissions bypass Turnstile only in an Astro development build with `APP_ENV=local` on a loopback hostname. Built staging and production versions fail closed without real configuration. `/admin` has no development authentication bypass.

```sh
npm test
npm run build
```

Stop the development daemon with `npm exec astro dev stop` before running the production build; the framework check and running dev server share the Vite cache. Restart development after the build. `astro dev logs` reads daemon logs.

## Behavior

- Ratings accept integer 0–10 scores, with no initial selection. Database uniqueness, transactional receipts and optimistic versions make replacement and retries safe. Concurrent conflicting revisions return a recoverable conflict.
- Public aggregates include zero scores correctly; an empty chapter has no average.
- Comments are independent, plain text, public immediately, newest first, twenty per page. Browser ownership authorizes editing/deletion. Reporting never automatically hides a comment.
- Access JWTs are verified for signature, issuer, audience, expiry, type and the configured email on every administrator request. Alternate deployment addresses cannot authorize administrator access.
- The administrator compares distributions, streams credential-free CSV snapshots, hides/restores comments, reviews reports, renames chapter titles and appends chapters. Reader-deleted text is purged from active tables and cannot be restored by moderation.

## Launch status

Implementation is local. No Cloudflare account resources, public staging site or production deployment have been created. Domain, administrator email, Cloudflare Access configuration and Turnstile keys are required. Review the working staging site before launch as specified by the product plan.

The UUIDs and empty variables in `wrangler.jsonc` are deliberate placeholders. Do not deploy them. Run `node scripts/preflight.mjs staging` or `production` before packaging a real environment. Deployment, recovery, moderation and usage procedures are in [docs/operations.md](docs/operations.md). Generate the nine final book links after launch with `node scripts/chapter-links.mjs https://your-approved-domain`.

See [PRODUCT.md](PRODUCT.md), [CONTEXT.md](CONTEXT.md), [docs/development-plan.md](docs/development-plan.md), and [docs/design-review.md](docs/design-review.md). Historical generated mockups retain the earlier book title; all shipped text uses **An Afterlife for Atheists**.

## Vercel UI preview

Vercel uses `vercel.json` to run `node scripts/build-preview.mjs`. This generates static copies of the homepage, nine chapter pages, privacy, and guidelines in `dist/`. The isolated build uses the initial chapter titles and empty results, excludes admin/API routes, and displays a preview message when a form is submitted. It does not connect to D1 or save ratings/comments. The normal Astro build still targets Cloudflare.
