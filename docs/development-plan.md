# Development plan

Status: Phase 1 approved. The user selected composition B and explicitly approved the expanded mockups on 2026-10-09. The responsive interface, SQLite persistence, and administrator workspace are implemented locally; Phase 5 verification is in progress. Local administrator accounts must be initialized during setup. Public launch requires configuration and a separate review of the working staging website.

## Phase 1: Product record and visual design

- Record product truth and domain vocabulary separately.
- Produce three homepage compositions in the user-selected literary world.
- After the composition choice, expand it into desktop/mobile and light/dark chapter-page mockups.
- Generate the standalone abstract ink artwork, with appropriate light/dark treatment and exact generation prompts retained.
- Obtain the required visual approval before UI implementation.

## Phase 2: Interface

- Astro/TypeScript with native CSS and small browser scripts.
- Homepage: compact factual introduction, abstract artwork, eleven chapter links.
- Chapter flow: chapter title and prompt, explicit 0–10 rating, immediately visible results, independent comment form, comments, chapter navigation.
- Responsive accessible score choices, persistent system/light/dark themes, and complete loading/empty/success/error states.
- Development-only demonstration data is explicitly labeled.

## Phase 3: Data and public submissions

- Native Node 22.19 or supported Node 24 under PM2 with SQLite on Ubuntu, behind Nginx with Certbot HTTPS and DNS-only routing; versioned SQL migrations and independent local/staging/production data.
- Seed the eleven official chapters. Permanent numbered routes such as /chapters/1; renaming must not change identity or URL.
- One current rating per chapter and browser identity, enforced by a database constraint. Atomic replacement, accurate aggregates, and retry-safe submissions.
- Secure random ownership cookie; only its hash is stored for ownership. Never expose credentials in responses, logs, or exports.
- Independent comments; optional unverified display names; owner edit/delete; newest first, 20 per page; report without automatically hiding.
- Validate integers 0–10, names up to 60 characters, and plain-text comments up to 2,000 characters server-side.
- Signed form tokens, honeypots, minimum form age, rate limiting, origin checks, safe rendering, and authorization on every mutation.
- Preserve form text on failure; announce success only after persistence. Empty ratings show “No ratings yet.”

## Phase 4: Administration

- /admin pages and endpoints protected by separate local email/password accounts for both approved emails with equal permissions; validate hashed sessions, expiry, and approved email on each request. Passwords are set/reset through a server command.
- Prevent bypass through alternate deployment hosts or direct API access.
- Chapter comparisons, per-chapter distributions/counts, CSV exports, reported-comment review, hide/restore, title edits, and appended chapters.
- Preserve numbered chapter identity. Reader-deleted comments cannot be restored.
- Exclude ownership credentials from exports; neutralize spreadsheet formula execution.

## Phase 5: Verify and launch

- Implement meaningful integration tests for ownership, ratings, aggregates, comments, pagination, moderation, chapter stability, auth, and exports.
- Test retry/concurrent rating updates and duplicate comment submissions; invalid scores; Unicode; service failures; missing/tampered form tokens and honeypots; wrong passwords and forged/expired administrator sessions.
- Verify all browser flows, keyboard navigation, screen-reader labels, responsive layout, themes, contrast, reduced motion, and long titles.
- Batch desktop/mobile/light/dark visual inspection; fix the batch and confirm once. Complete the Impeccable finish review and document the built design.
- Verify a database export restores into an isolated test database; document backup/recovery, deployment, moderation, and usage checks.
- Obtain the user's review of working staging before production publication.
- Configure the final domain, HTTPS, both administrator emails, and production protection; keep test data out of production.
- After launch approval, deploy and verify all eleven URLs, then deliver the permanent chapter-link list.

## Approved copy

Homepage introduction: “A chapter-by-chapter reader survey for An Afterlife for Atheists. Choose a chapter to rate how convincing you found its case for an afterlife and read or leave comments.”

Chapter greeting: “Thank you for reading.”

Chapter question: “How convincing did you find this chapter’s case for the existence of an afterlife?”

Scale: “0 — Not at all convincing” to “10 — Extremely convincing.”

Comments heading: “Comments.” Form heading: “Leave a comment.” Optional field: “Name or nickname (optional).” Action: “Post comment.”

The question and scale were user-approved in the plan. The user approved supporting interface wording with the mockups; the implemented homepage uses the compact factual introduction shown in composition B. The final title is “An Afterlife for Atheists.”

## Outstanding user inputs

- Final production domain and initialized local administrator accounts before launch. Staging uses afterlife.abenezer-ayalneh.dev; both approved administrator emails are recorded in PRODUCT.md.
- The official eleven chapter titles were supplied on 2026-10-09 and replace the provisional labels.

## VPS preparation

Native Node/SQLite deployment assets, PM2 configuration, isolated migration/backup tooling, and direct Nginx configuration are prepared. Docker is optional for SQLite maintenance tools only. This work does not deploy or configure the VPS. Manual backups only, as requested; see docs/operations.md and docs/adr/0001-native-vps-sqlite.md.

## Technical references

- Astro Node adapter: https://docs.astro.build/en/guides/integrations-guide/node/
- Node 24 SQLite: https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html
- Password storage: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- Certbot webroot TLS: https://eff-certbot.readthedocs.io/en/stable/using.html#webroot

Recheck configuration against the actual VPS before installing. No remote resources have been configured by this migration.
