# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the user and settled in the approved development plan: Astro, TypeScript, native CSS, small client-side scripts, native Node 22.19 (or supported Node 24) under PM2 on the Ubuntu VPS, SQLite, separate local email/password accounts for two equal administrators, and local signed forms/honeypots/rate limits for public submissions.

## Users

Readers of *An Afterlife for Atheists* arriving from links at the end of individual chapters. Anyone may browse, rate, and comment without signing in. One administrator manages the survey.

## Product Purpose

Collect readers' assessments of each chapter's persuasiveness regarding the existence of an afterlife, alongside optional public comments. Success is a clear, quick submission experience and useful, accurately counted responses for the author.

## Positioning

This is a survey for one specific book, initially containing eleven chapters. A chapter rating measures the persuasiveness of that chapter, not overall belief, belief change, or writing quality. The website welcomes different viewpoints and does not make claims about whether an afterlife exists.

## Operating Context

Readers follow durable numbered chapter links from the book. The eleven official chapter titles are supplied and used in reading order. The homepage provides a short introduction and chapter index. Expect gradual readership of up to a few hundred visitors daily initially.

## Capabilities and Constraints

- Scores are integers 0–10, with no preselected score and an explicit submit action. Endpoints are “Not at all convincing” and “Extremely convincing.”
- Readers may replace their saved rating from the same browser. Replacement does not increase response count.
- Chapter averages, response counts, and score distributions are public immediately.
- Comments are independent of ratings, publish immediately, and belong to one chapter. No replies or reactions in v1.
- Names are optional and unverified; missing names display as “Anonymous reader.”
- Readers may edit or delete their comments from the same browser. Different devices or cleared cookies cannot recover ownership.
- Reporting and administrator hiding/restoration support moderation without automatic removal based on report count.
- One administrator uses an email sign-in code. Admin tools include results, CSV exports, comment moderation, chapter renaming, and appending chapters.
- Chapter identifiers and published URLs remain stable when titles change.
- English interface; comments may be in any language. No reader accounts, demographics, advertising analytics, or book purchase flow.
- Defaults: plain-text comments up to 2,000 characters, names up to 60 characters, newest-first comments paginated 20 at a time.
- Use the existing 2 GB GoDaddy Ubuntu VPS and Nginx, with direct DNS-only routing, Nginx proxying and Certbot HTTPS for the temporary staging domain. A dedicated production domain will be supplied later. No fixed deadline.

## Brand Commitments

Use the exact title “An Afterlife for Atheists.” The user selected a restrained identity independent of the book cover: quiet and literary, warm light and charcoal dark themes, book-like serif headings, clear sans-serif controls, muted earthy accents, and generous empty space. The original abstract ink illustration suggests multiple perspectives without religious symbols or depicting an afterlife. No slogans or catchphrases anywhere.

## Evidence on Hand

The user supplied the title, chapter count, purpose, and approved requirements. The eleven official chapter titles have been supplied. The temporary staging domain is afterlife.abenezer-ayalneh.dev. Authorized administrator emails are abenezer.ayalneh.42@gmail.com and boersarama@gmail.com, with equal permissions. No manuscript, book cover, author biography, or final production domain has been supplied. Do not fabricate these or production survey responses. Demonstration data must be labeled.

## Product Principles

- Make the chapter-specific survey easy to find and complete.
- Treat agreement and disagreement with equal respect.
- Describe ratings as reader responses, never evidence proving an afterlife.
- Preserve links embedded in the book.
- Keep reader participation open while protecting submission ownership.

## Accessibility & Inclusion

Target WCAG 2.2 AA, including keyboard access, visible focus, screen-reader labels, sufficient contrast, reduced motion, and narrow-screen layouts. Default theme follows the system, with persistent Light, Dark, and System controls.

## Delivery Checkpoints

The user requires approval of mockups, illustration, and copy before UI implementation, then approval of the working staging site before public launch. Intermediate development phases continue when their agreed verification passes. The user selected image mockups before code.

## Official Chapters

1. Religion
2. Philosophy
3. Out-of-Body Experiences
4. Near-Death Experiences
5. Children's Past Lives
6. Adults' Past Lives
7. End-of-Life Phenomena
8. After Death Encounters
9. Agents of the Dead (Mediums)
10. Mystica
11. Consciousness
