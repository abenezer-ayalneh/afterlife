# Homepage composition review

Status: **visual checkpoint approved**. The user selected **B — Contents page** ("I chose plan B") and explicitly approved the expanded mockups on 2026-10-09 ("I approve the mockups"). The approved direction includes homepage and chapter layouts on desktop and mobile, both themes, illustration treatments, and interface wording. The implemented website is undergoing local verification. Public launch has a separate checkpoint and has not been approved.

## Options

- A — Centered introduction: `.impeccable/mocks/home-a.png`. A compact three-column chapter index underneath a centered title and ink study.
- B — Contents page: `.impeccable/mocks/home-b.png`. Title and ink study share the introduction; all nine chapters have full-width rows. Recommended because long final chapter titles have room and the order stays obvious.
- C — Chapter directory: `.impeccable/mocks/home-c.png`. Title, ink study, and description share a horizontal band above three columns of chapters.

The three images were generated with the built-in image_gen tool. Exact prompts accompany each image as `.prompt.txt` and `.png.json`, and are embedded in PNG metadata. Only B's sidecar is marked approved; A and C remain unapproved alternatives.

## Review delivery

Full selected-direction review: http://127.0.0.1:63421/docs/design-review.html

Saved review source: `docs/design-review.html`. From the project root, restart its server with `python3 -m http.server 63421 --bind 127.0.0.1` if necessary. The gallery includes desktop and mobile homepage and chapter layouts in both themes, a separate mobile results/comments viewport, illustration assets on their intended backgrounds, and canonical interface wording.

Original composition comparison page: http://127.0.0.1:61718/

Question key: e0030426. Retrieve a page selection with `/Users/abeni/.agents/skills/impeccable/scripts/impeccable serve-question --wait --key e0030426`. The page is a local design-review tool, not a public deployment. If its process is gone, restart it from `.impeccable/mocks/options.json`.

Illustration/build-plan approval session: `2683bfb40aa4c222079fc7235c5faebea3ec6d82445cceaaf4d0239f0abfe0b3`. The user approved the illustration and code-region inventory through the local browser review; its receipt was verified before implementation. The broader mockup approval is recorded above from the user's conversation message. This does not create a first-viewport acceptance receipt or authorize publication.

Standalone generated assets: `assets/plates/ink-study.png` and `assets/plates/ink-study-dark.png`. Both have transparency, retained generation prompts and provenance sidecars. The light plate passed the geometry/material check with score 0.8507. The illustration was approved by the user through the review described above.

## After the choice

The selected composition was expanded into chapter designs and desktop/mobile/light/dark treatments with a standalone ink illustration. The visual implementation checkpoint is now approved. The working staging website must still be reviewed before public launch.

Preserve the accepted survey question and endpoint labels. Mockup artwork must become a standalone generated asset; do not ship a crop containing raster UI text. All text and controls must be semantic, accessible HTML. Final fonts must be locally served and licensed. Placeholder chapter labels will be replaced with the supplied titles without changing numbered routes.

## Initial visual checks

All three initial mockups contain the correct book title, all nine chapter links, a theme control, factual introduction, and policy links. Each uses the agreed light palette and abstract artwork with no slogans or religious symbols.

The expanded gallery was opened and inspected in the in-app browser. Light/dark chapter compositions and the standalone transparent illustrations render correctly. A review screenshot is saved at `docs/design-review-preview.png`. The initial small-type mobile draft is superseded by `home-mobile-light-v2.png` and is omitted from the review. Keyboard accessibility and interactive behavior will be verified against the real implementation; static images do not prove those behaviors.

## Title correction

The user requested **An Afterlife for Atheists** on 2026-10-09. This exact title replaces the earlier working title throughout the website. Generated mockups retain the earlier title as historical layout references; their lettering is not shipped. The illustration and code-region inventory were approved through the local review; the signed current packet was verified before entering implementation.

## Requested spacing and theme changes

On 2026-10-09, the user requested more space above the footer separator, doubled chapter-row height with vertically centered content, and light/system/dark icons in place of the dropdown. These explicit changes supersede the corresponding mockup geometry and theme-control shape. Desktop rows use a 90px minimum, mobile rows 124px; footer separation is 84px and 64px respectively. Icon buttons retain accessible names, keyboard operation, pressed state, and persistent theme preferences.

The user additionally requested removal of the last chapter row’s bottom border. The list now retains separators between chapters and omits only its trailing rule; the footer separator remains separate.
