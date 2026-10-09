# Development plan

Status: Phase 1 approved. The user selected composition B and explicitly approved the expanded mockups on 2026-10-09. The responsive interface, D1 persistence, and administrator workspace are implemented locally; Phase 5 verification is in progress. Cloudflare resources have not been provisioned. Public launch requires configuration and a separate review of the working staging website.

## Phase 1: Product record and visual design

- Record product truth and domain vocabulary separately.
- Produce three homepage compositions in the user-selected literary world.
- After the composition choice, expand it into desktop/mobile and light/dark chapter-page mockups.
- Generate the standalone abstract ink artwork, with appropriate light/dark treatment and exact generation prompts retained.
- Obtain the required visual approval before UI implementation.

## Phase 2: Interface

- Astro/TypeScript with native CSS and small browser scripts.
- Homepage: compact factual introduction, abstract artwork, nine chapter links.
- Chapter flow: chapter title and prompt, explicit 0–10 rating, immediately visible results, independent comment form, comments, chapter navigation.
- Responsive accessible score choices, persistent system/light/dark themes, and complete loading/empty/success/error states.
- Development-only demonstration data is explicitly labeled.

## Phase 3: Data and public submissions

- Cloudflare Workers with D1; versioned SQL migrations and independent local/staging/production data.
- Seed Chapters 1–9. Permanent numbered routes such as /chapters/1; renaming must not change identity or URL.
- One current rating per chapter and browser identity, enforced by a database constraint. Atomic replacement, accurate aggregates, and retry-safe submissions.
- Secure random ownership cookie; only its hash is stored for ownership. Never expose credentials in responses, logs, or exports.
- Independent comments; optional unverified display names; owner edit/delete; newest first, 20 per page; report without automatically hiding.
- Validate integers 0–10, names up to 60 characters, and plain-text comments up to 2,000 characters server-side.
- Server-validated Turnstile, rate limiting, origin checks, safe rendering, and authorization on every mutation.
- Preserve form text on failure; announce success only after persistence. Empty ratings show “No ratings yet.”

## Phase 4: Administration

- /admin pages and endpoints protected by Cloudflare Access email OTP for one approved email; validate token signature, issuer, audience, expiry, and email in the application.
- Prevent bypass through alternate deployment hosts or direct API access.
- Chapter comparisons, per-chapter distributions/counts, CSV exports, reported-comment review, hide/restore, title edits, and appended chapters.
- Preserve numbered chapter identity. Reader-deleted comments cannot be restored.
- Exclude ownership credentials from exports; neutralize spreadsheet formula execution.

## Phase 5: Verify and launch

- Implement meaningful integration tests for ownership, ratings, aggregates, comments, pagination, moderation, chapter stability, auth, and exports.
- Test retry/concurrent rating updates and duplicate comment submissions; invalid scores; Unicode; service failures; missing/invalid Turnstile; forged/expired admin tokens.
- Verify all browser flows, keyboard navigation, screen-reader labels, responsive layout, themes, contrast, reduced motion, and long titles.
- Batch desktop/mobile/light/dark visual inspection; fix the batch and confirm once. Complete the Impeccable finish review and document the built design.
- Verify a database export restores into an isolated test database; document backup/recovery, deployment, moderation, and usage checks.
- Obtain the user's review of working staging before production publication.
- Configure the purchased domain, HTTPS, administrator email, and production protection; keep test data out of production.
- After launch approval, deploy and verify all nine URLs, then deliver the permanent chapter-link list.

## Approved copy

Homepage introduction: “A chapter-by-chapter reader survey for An Afterlife for Atheists. Choose a chapter to rate how convincing you found its case for an afterlife and read or leave comments.”

Chapter greeting: “Thank you for reading.”

Chapter question: “How convincing did you find this chapter’s case for the existence of an afterlife?”

Scale: “0 — Not at all convincing” to “10 — Extremely convincing.”

Comments heading: “Comments.” Form heading: “Leave a comment.” Optional field: “Name or nickname (optional).” Action: “Post comment.”

The question and scale were user-approved in the plan. The user approved supporting interface wording with the mockups; the implemented homepage uses the compact factual introduction shown in composition B. The final title is “An Afterlife for Atheists.”

## Outstanding user inputs

- Purchased domain and authorized administrator email before launch.
- Final chapter titles may arrive later; Chapter 1 through Chapter 9 are approved placeholders.

## Technical references

- Astro on Workers: https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/
- Workers free tier and limits: https://developers.cloudflare.com/workers/platform/pricing/
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- Access token validation: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- Turnstile plans: https://developers.cloudflare.com/turnstile/plans/

Recheck current limits and supported package versions during implementation. No cloud resources have been provisioned.
