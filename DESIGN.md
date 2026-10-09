---
name: "An Afterlife for Atheists"
description: "The implemented literary reader-survey design system."
colors:
  surface: "#f5f2ed"
  text: "#22241f"
  muted: "#5b6253"
  line: "#cfcdc0"
  control-line: "#7f8774"
  accent: "#4d603f"
  on-accent: "#fff"
  field: "#faf8f4"
  hover: "#eeece6"
  danger: "#923a30"
  focus: "#6c7434"
  dark-surface: "#20241f"
  dark-text: "#eeeede"
  dark-muted: "#b5bcaa"
  dark-line: "#454a3d"
  dark-control-line: "#858f79"
  dark-accent: "#bac9a7"
  dark-on-accent: "#20271b"
  dark-field: "#262b23"
  dark-hover: "#2b3228"
  dark-danger: "#f4a095"
  dark-focus: "#c9d994"
typography:
  display:
    fontFamily: "Wittgenstein, Georgia, serif"
    fontSize: "78px"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Wittgenstein, Georgia, serif"
    fontSize: "54px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  section:
    fontFamily: "Wittgenstein, Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  chapter-title:
    fontFamily: "Wittgenstein, Georgia, serif"
    fontSize: "25px"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  introduction:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  field-label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  field: "2px"
  button: "3px"
  hover: "4px"
  radio: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  field: "12px"
  md: "16px"
  content: "20px"
  lg: "24px"
  section: "32px"
  major: "40px"
  opening: "48px"
  footer: "84px"
  footer-mobile: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.button}"
    padding: "9px 24px"
    height: "46px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    rounded: "{rounded.button}"
    padding: "9px 24px"
    height: "46px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "9px 24px"
    height: "46px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
    width: "100%"
  chapter-row:
    textColor: "{colors.text}"
    typography: "{typography.chapter-title}"
    padding: "4px 20px"
    height: "90px"
  score-mobile:
    textColor: "{colors.text}"
    rounded: "{rounded.button}"
    height: "48px"
  score-mobile-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.button}"
    height: "48px"
---
# Design System: An Afterlife for Atheists

## Overview

**Creative North Star: "The Contents Page"**

The Contents Page is a quiet literary system for readers of An Afterlife for Atheists. Cream paper, charcoal type, moss controls, locally served serif headings, and humanist sans-serif text make the survey feel connected to reading. Fine rules and aligned numbers organize information without enclosing it in cards.

Original abstract ink plates give the homepage its visual character. They suggest multiple perspectives without religious symbols or depicting an afterlife. The reader workflow uses familiar semantic controls and small native scripts; motion is limited to ordinary navigation and brief state feedback. This document records the implemented local interface, not approval of the whole delivery pipeline or public launch.

**Key Characteristics:**
- Literary serif headings and clear sans-serif controls.
- Theme-aware cream, charcoal, and moss palette.
- Aligned numbers, fine dividers, and generous open space.
- Original ink imagery with live HTML text and controls.

## Colors

The palette reads as neutral paper and ink with restrained earthy controls. The frontmatter records the implemented values; the earlier surface brief's provisional cream and charcoal are superseded by these tokens.

### Primary

- **Moss** (`accent`): links, primary actions, selected scores, and result bars; **Sage** (`dark-accent`) serves the same role on charcoal.
- **On Accent** (`on-accent`, `dark-on-accent`): legible text inside filled controls and selected scores.
- **Error Ink** (`danger`, `dark-danger`): destructive actions and form errors.
- **Focus Olive** (`focus`, `dark-focus`): visible keyboard outlines, independent of selection.

### Neutral

- **Cream Paper / Charcoal Ground** (`surface`, `dark-surface`): page canvas.
- **Charcoal Ink / Warm White** (`text`, `dark-text`): primary text.
- **Quiet Ink** (`muted`, `dark-muted`): labels, metadata, hints, endpoint descriptions.
- **Stone Rule** (`line`, `dark-line`): section dividers, list rows, and chart baselines.
- **Control Stroke** (`control-line`, `dark-control-line`): field and mobile score-tile boundaries.
- **Field Paper** (`field`, `dark-field`): editable inputs.
- **Hover Wash** (`hover`, `dark-hover`): chapter-row and score-choice hover feedback.

**The Paper and Ink Rule.** Use theme roles together: surface, text, divider, field, and accent must change as one set. Keep the illustration matched to the active theme.

## Typography

**Display Font:** Wittgenstein, Georgia, serif. Locally served weight 400.
**Body Font:** Source Sans 3, system-ui, sans-serif. Locally served weights 400 and 600.

**Character:** The serif supplies the book-like voice; the sans-serif keeps participation and public data legible. Neither font is used as an ornamental label system.

### Hierarchy

- **Display:** Frontmatter `display` governs the desktop homepage title. It becomes 60px at 1050px and below, then 50px/1.12 at 680px and below.
- **Headline:** Frontmatter `headline` governs chapter headings; narrow-screen headings become 44px.
- **Section:** Frontmatter `section` governs section headings; narrow-screen headings become 29px. The homepage contents heading has its own 39px, 35px, and 31px responsive treatment.
- **Chapter title:** Frontmatter `chapter-title` governs contents rows; the middle breakpoint uses 26px and the narrow breakpoint 23px.
- **Body:** Frontmatter `body` governs ordinary text; narrow screens use 17px. Long policy prose is capped at 70ch.
- **Introduction:** Frontmatter `introduction` governs desktop introduction copy, capped at 530px; it becomes 21px at the middle breakpoint and 18px/1.5 at the narrow breakpoint.
- **Labels:** Frontmatter `label` and `field-label` govern compact controls and field names. Scores and results use tabular numerals. Results use 36px serif figures; survey legends use 25px serif, falling to 23px on narrow screens.

**The Reading Pair Rule.** Use Wittgenstein at weight 400 for headings and chapter titles; use Source Sans 3 for explanations, numbers, labels, and controls.

## Layout

The homepage and chapter survey pages are centered with a shared maximum width of 1208px and 32px side gutters. Policy pages use an 800px maximum width. At 680px and below, both use 20px side gutters. Shared spacing steps are recorded in frontmatter; large sections generally use 32–40px separation and fine horizontal rules.

The desktop homepage pairs the introduction and original ink study, followed by full-width contents rows. The text column is 550px; the illustration is positioned beside it. At the middle breakpoint the text column becomes proportional; at the narrow breakpoint the image moves beneath the introduction. Contents rows use number, title, and arrow columns; long titles wrap. Rows have 90px desktop and 124px mobile minimum heights, with all three columns vertically centered. The footer separator has 84px of space above it on desktop and 64px on mobile.

Score choices use outlined number tiles at every screen size, arranged in eleven equal columns on desktop. At the narrow breakpoint, they use a twelve-column grid: six choices on the first row and five centered on the second. The rating submit button spans the available width. Result bins retain eleven columns; navigation and metadata wrap as needed. The local interface has been inspected at 320, 390, 1280, and 1536px; retain these representative widths when extending the system.

## Elevation & Depth

The page has no ornamental shadows. Depth comes from field tones, hover washes, rules, and ink texture. Checked score tiles use filled accent backgrounds with matching On Accent text to distinguish selection. Keyboard focus uses a three-pixel outline with a four-pixel offset.

**The Flat Page Rule.** Separate content with space and fine rules. Do not add ornamental shadows to the literary page.

## Shapes

The overall page is open and rectangular. Buttons and score tiles have slight three-pixel rounding; fields have two-pixel rounding. Score tiles use one-pixel Control Stroke borders and a 48px minimum height at every screen size. Dividers and field borders are fine one-pixel strokes; do not inflate these into decorative frames.

## Components

### Buttons

Quiet, explicit actions. Primary actions use Moss/Sage with the matching On Accent text. Secondary actions are transparent with accent text and a Stone Rule border. Destructive buttons use Error Ink and the theme's surface text. The frontmatter holds padding, minimum height, and corners; the implementation interprets `height` as a minimum. Hover reduces brightness; disabled controls reduce opacity and use the waiting cursor. Focus uses the shared outline.

### Inputs / Fields

Plain native editing surfaces with Control Stroke borders and Field Paper backgrounds. Text inputs and textareas occupy their container width with the frontmatter padding. Textareas resize vertically and have a 100px minimum height. Labels remain visible above fields; hints use Quiet Ink. Form-status errors use Error Ink, and status regions remain live for assistive technology.

### Navigation

A slim header places the survey or book name opposite three native icon buttons: Light (sun), System (monitor), and Dark (moon). Each 20px SVG sits within a 44px square target with an accessible name and title. The selected preference uses a Control Stroke border, Hover Wash background, accent icon, and aria-pressed state. Keyboard focus uses the shared outline. The chosen preference persists, and System follows the operating system. The same three buttons remain available on narrow screens. Back/previous/next links use inline SVG arrows. Footer policies remain simple text links separated by a native small vertical rule.

### Contents Rows

An aligned two-digit chapter-number margin, serif chapter title, and inline SVG arrow create the signature contents-page rhythm. Desktop rows have a 90px minimum height; mobile rows have a 124px minimum height and reduced number-column width. Numbers, titles, and arrows remain vertically centered. Fine dividers separate the rows; the last row has no bottom border. Hover supplies a quiet wash. Whole rows are links.

### Score Choices

Semantic radio inputs offer 0–10 with endpoint descriptions and no preselected score for a new reader. All layouts use outlined score tiles with centered 18px tabular numerals, filled accent selection, and focus on the enclosing tile. Transparent native radio inputs cover the full tiles and retain keyboard and screen-reader access. Submission remains a separate explicit action.

### Results and Comments

Results pair large serif summary figures with an eleven-bin distribution using accent bars and tabular labels. Empty states are factual text. Comments are open articles separated by fine rules, with author/date metadata and native disclosure controls for edit, delete, and report. They do not form elevated cards.

## Do's and Don'ts

### Do:

- **Do** preserve the exact title An Afterlife for Atheists and factual survey wording.
- **Do** use locally served Wittgenstein and Source Sans 3 with the documented fallbacks.
- **Do** carry the aligned number margin through chapter rows, score labels, and result bins.
- **Do** keep original ink plates decorative, theme matched, and separate from semantic text.
- **Do** preserve keyboard focus, unselected new-rating choices, endpoint labels, and explicit submission.
- **Do** test long chapter titles and both themes at narrow widths.

### Don't:

- **Don't** add slogans, catchphrases, religious symbols, or claims depicting an afterlife.
- **Don't** rasterize interface text or controls into the artwork.
- **Don't** introduce decorative shadows, animated flourishes, or a card grid in place of the established contents rows.
- **Don't** turn rating results into evidence proving an afterlife or fabricate reader responses.
