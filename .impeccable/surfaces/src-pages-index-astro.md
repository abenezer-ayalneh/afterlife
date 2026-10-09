---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/pages/chapters/[id].astro"]
---

# Homepage and chapter survey

Mode: Operate. A reader arrives from a chapter link or chooses a chapter from the homepage, submits a persuasiveness score, and may read or leave a comment. Public results are immediately visible. Preserve the approved product record and wording.

## Direction contract

THESIS: Make finding the correct chapter as direct as reading a contents page, with an uncluttered survey at each destination.

OWN-WORLD: Warm off-white #F5F3ED and charcoal #292B27, moss #596448 links and selected controls, fine stone dividers, book serif headings, clear humanist sans body and controls. Dark mode uses charcoal ground and warm near-white type with a lighter sage accent.

STORY: Recognize the book, choose the chapter read, rate its persuasiveness, and optionally leave a public comment.

FIRST VIEWPORT: Homepage has a slim reader-survey/theme header; a two-column title-and-ink-study opening; then eleven full-width numbered chapter rows. Chapter pages put the title and question first, 0–10 radio choices and submit next, followed by public results and independent comments.

FORM: Contents page, candidate 1, selected as option B from surface seed 3e9f955e. Approved homepage comp: .impeccable/mocks/home-b.png. User approval: "I chose plan B". The signature move is the aligned chapter-number margin, continued by aligned score labels and result bins in the survey. Familiar controls throughout; restrained focus/hover feedback, reduced-motion support.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Visual review boundary

The homepage composition and expanded desktop/mobile/light/dark mockups are approved. The user said “I approve the mockups” on 2026-10-09; the standalone illustration and inventory were approved through the local review. Do not treat this selection as approval to publish. Core text and controls will remain semantic HTML, never rasterized mockup content. The eleven official chapter titles supplied on 2026-10-09 replace the provisional labels.

## Requested interface refinements

The user explicitly superseded the approved mockup row geometry and theme dropdown on 2026-10-09: double each chapter row and keep its text vertically centered, increase space above the footer separator, and use Light/System/Dark icons. Implemented minimum row heights are 90px desktop and 124px mobile. Footer gaps are 84px and 64px. Accessible native icon buttons are 44px square; theme persistence and System behavior remain required. This scoped refinement does not approve deployment or close earlier workflow gates.

On 2026-10-09, the user requested chapter reading and survey pages match the homepage width. Both now share the 1208px maximum page shell with 32px desktop side gutters and 20px side gutters at 680px and below. Policy pages retain their existing narrow shell; survey behavior is unchanged.

On 2026-10-09, the user requested the mobile boxed number rating choices at every screen size. The 48px minimum-height outlined tiles now appear in one row of eleven on desktop, retaining six choices followed by five centered choices at 680px and below. Native radio selection, keyboard focus, endpoint labels, and explicit submission remain required.
