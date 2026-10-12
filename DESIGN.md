---
name: HedgeHound · The Canis Edition
description: A funding-spread observatory in a real night sky. Minimal, dark, scroll-driven, honest.
colors:
  void: "#010104"
  starlight: "#f4f1ea"
  starlight-dim: "rgb(244 241 234 / 0.62)"
  starlight-faint: "rgb(244 241 234 / 0.38)"
  chart-line: "#9aa0ad"
  scan-cyan: "#7fdcff"
  scent-orange: "#ff8a3d"
  star-cool: "#c9d6ff"
  star-warm: "#ffe2c4"
typography:
  display-hero:
    fontFamily: "Noto Serif Display Variable, serif"
    fontSize: "clamp(3.2rem, 9vw, 8.5rem)"
    fontWeight: 180
    lineHeight: 0.95
    letterSpacing: "-0.015em"
  display-chapter:
    fontFamily: "Noto Serif Display Variable, serif"
    fontSize: "clamp(2.6rem, 5vw, 4.6rem)"
    fontWeight: 180
    lineHeight: 0.95
    letterSpacing: "-0.015em"
  display-title:
    fontFamily: "Noto Serif Display Variable, serif"
    fontSize: "clamp(2.2rem, 3.6vw, 3.4rem)"
    fontWeight: 180
    lineHeight: 0.95
    letterSpacing: "-0.015em"
  subtitle:
    fontFamily: "Noto Serif Display Variable, serif"
    fontSize: "clamp(1.2rem, 1.4vw, 1.45rem)"
    fontWeight: 330
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Noto Serif Display Variable, serif"
    fontSize: "clamp(1.05rem, 0.35vw + 0.95rem, 1.2rem)"
    fontWeight: 330
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 300
    lineHeight: 1.3
    letterSpacing: "0.22em"
  figure:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: "0.06em"
  bayer:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  none: "0px"
  pill: "999px"
spacing:
  gutter: "max(16px, 7vw)"
  hud: "24px"
components:
  source-tag:
    textColor: "{colors.starlight}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
  coin-label:
    textColor: "{colors.starlight-dim}"
    typography: "{typography.figure}"
  coin-label-alert:
    textColor: "{colors.scent-orange}"
    typography: "{typography.figure}"
  star-label:
    textColor: "{colors.scan-cyan}"
    typography: "{typography.bayer}"
---

# Design System: HedgeHound · The Canis Edition

Prototype of record: route `/_almagest` on branch `D1-almagest` (direction spike D1, rounds 1–3 plus fixes, commits `fd5ab11`…`8b708bb`). When this file and the prototype disagree, ask the owner; until then the prototype wins on look and feel.

## The owner's taste (read this first)

This site follows the owner's taste. Every choice below comes from what they asked for while scrolling the prototype. Where the owner's own words are quoted, they are theirs.

1. **It has to feel like space.** The Grok build "doesn't feel like space at all". The page is a real night sky: near-black, dense faint stars, real constellation geometry (Canis Major from J2000 coordinates), and Greek Bayer letters in cyan, as on the owner's two reference sky charts.
2. **Minimal layout, minimal colour.** No cards behind text: "white and black already contrast to read." Copy sits straight on the sky. Colour is starlight on black; cyan and orange appear only when they mean something.
3. **Two fonts, thin and old-but-new.** Noto Serif Display at its thinnest ("still reminds me of ancient, just modern"), with JetBrains Mono for labels and data. Ancient Mesopotamia and Greece, with a modern space twist.
4. **Motion is locked to the scroll.** "Every time I scroll the pixel or dither follows, and if the scroll stopped then it stopped." Fluid like Shopify Editions, heavily animated, with parallax depth.
5. **Transitions eat the picture.** Dither, not chunky pixels, because "the transitions become almost indistinguishable". A transition is pixels biting the scene away, "there will be new bite marks", not a mask sliding past. Low noise; what remains reads as shimmering stars, never white clouds or haze.
6. **No bloom, no glow.** "The bloom looks cheap." Stars are crisp points. The glass hound is clear, rounded, transparent, nearly colourless, and moves only subtly with the cursor.
7. **Things grow from where they connect.** A reading draws its line first and then gathers out of star specks, "more subtle than now". The Canis Major copy simply rises with the scroll, with no effect of its own.
8. **Shimmer you can actually see.** The owner chose `@spell/shimmer-text` for titles and `@spell/logos-carousel` for the symbol carousel.
9. **No artefacts.** Ghost copies, clipped text, halos with hard edges: the owner spots them in seconds. They are bugs, not polish items.
10. **Honest over flashy.** The owner asked for red/green price moves on the carousel. When it turned out the scanner doesn't measure prices, they took net APR instead. Every figure keeps its LIVE / PAPER / SAMPLE tag.

**How to work with this owner:** they judge by seeing and scrolling, not by reading plans. Build a prototype with switches for the open choices, let them scroll it, then write it down.

## Overview

**North star: "The observatory at night."** HedgeHound is a funding-spread scanner presented as a night-sky observatory. The sky is the interface: coins are stars, the scanner is a radar sweep, and every chapter is a region of sky you scroll through. The scroll is the only clock for transitions. Nothing important animates on its own, so the page feels like an instrument you are steering, not a show playing at you.

Key characteristics:
- Near-black void, crisp stars in two or three depth layers, and a real constellation as the hero chart.
- Copy laid directly on the sky in thin Noto Serif Display, with mono labels and Greek letters as the instrument layer.
- Transitions are scroll-locked "bites" that eat the current scene into shimmering stars, then rebuild the next one.
- One glass object (the hound) and otherwise no glass, cards or chrome.

## Colors

The palette is the night: one black, one starlight, and two signal colours with fixed meanings.

### Primary
- **Void** `#010104`: the page and the sky. There is no other background.
- **Starlight** `#f4f1ea`: all primary text and the brightest stars. Use it at 0.62 (`starlight-dim`) for body and secondary copy, and at 0.38 (`starlight-faint`) for captions and tertiary labels.

### Signals (meaning only, never decoration)
- **Scan cyan** `#7fdcff`: scanning and the long leg. Bayer letters (α β γ …), the radar sweep, the active chapter index and focus rings.
- **Scent orange** `#ff8a3d`: alerts and the short leg. Alerting coins on the radar and in the carousel, and the net APR of a clean scent. Nothing else is orange.

### Neutral
- **Chart line** `#9aa0ad`: constellation lines, radar rings and ticks, at 0.2–0.45 opacity.
- **Star cool / star warm** `#c9d6ff` / `#ffe2c4`: tints for star colour temperature only. Never used for UI.

### Named rules
- **The Two Signals Rule:** cyan means scanning or long, orange means alert or short. There is no green, no red, and no third accent.
- **The Honest Number Rule:** every figure carries a SourceTag (LIVE · time / PAPER / SAMPLE). One tag may cover a group of figures from the same source.

## Typography

Two families, both loaded locally through `@fontsource`.

- **Noto Serif Display Variable** for display titles, subtitles and body copy. Titles sit at weight ~180, the thinnest that still reads; subtitles and body sit at ~330. Subtitles are italic.
- **JetBrains Mono Variable** for labels, HUD text, Greek letters, figures and symbols. Use weight 300, uppercase, with wide tracking (0.22em) for labels. Figures use tabular numbers and tighter tracking (0.06em). Mono also carries the Greek Bayer letters.

### Hierarchy
1. **Hero:** the wordmark "HedgeHound", `display-hero` (clamp 3.2–8.5rem), with the shimmer.
2. **Chapter title** (e.g. "Sniff"), `display-chapter`, with the shimmer.
3. **Section title** (e.g. "The hound in the sky"), `display-title`, with the shimmer.
4. **Subtitle:** `subtitle`, an italic one-line voice ("Every five minutes, the hound lifts its nose.").
5. **Body:** `body`, max ~62ch, starlight-dim.
6. **Label / HUD:** `label`, e.g. "α · CANIS MAJOR", "RA 06H 45M 09S · DEC −16° 43′".
7. **Figure:** `figure`, e.g. "46.7% NET", always with a tag.

### Named rules
- **The Two Fonts Rule:** no third family. The retired faces (Bricolage, Fraunces, Pinyon, Syne, Marcellus, EB Garamond) stay retired.
- **The Real Glyph Rule:** use a true minus (−), primes (′), Greek letters and the middle dot (·). Never fake them with ASCII.

## Layout

- **Full-bleed sky, fixed stage.** One WebGL canvas fills the viewport. Copy lives on a fixed stage above it, and scroll length decides how long each scene lasts. There is no visible page "flow" of boxes.
- **Copy left, instruments right** on desktop. Copy column at `max(16px, 7vw)` from the left, up to ~500px wide. Instruments (constellation, radar, reading) take the right half.
- **HUD in the corners.** Top-left: the coordinate that drifts with the cursor around Sirius. Top-right: the edition name. Left edge: the α–κ chapter index, with the active letter lit cyan. Hidden under 768px.
- **Mobile (390×844).** The instrument goes above the copy, the HUD shrinks to the coordinate only, and options collapse. No horizontal scroll.
- **Chapters are named by Bayer letters** α to κ, not Roman numerals.

## Elevation & Depth

Depth comes from space, not shadows.
1. **Far star shell:** thousands of faint points, rotating slowly with scroll and cursor.
2. **Flight layer and dust:** stars that stream past as you scroll, giving parallax. They fade in from depth and out before the lens.
3. **The instrument of the chapter:** constellation, radar, or the glass hound.
4. **Projected labels:** DOM text pinned to 3D points (Bayer letters, coin labels, the reading).
5. **Copy:** on the fixed stage, above everything.

No drop shadows and no glow. Post-processing is limited to the scroll-locked crawl, very light film grain and a vignette. Bloom is banned.

## Shapes

Hairlines and points. Lines are 1px chart lines; stars are round points with a tight core and a falloff that reaches zero before the sprite edge (no discs). Rounded corners only on the small SourceTag pill and the prototype options box. The glass hound is the only rounded solid: deep bevel, soft edges.

## Components

### SourceTag
A mono pill reading `○ SAMPLE`, `◆ PAPER` or `● LIVE · 12:04`, with a dashed `◌ … · STALE` variant. It is required next to every figure or group of figures.

### Chart labels (Bayer letters)
A cyan Greek letter, plus the proper name in faint mono capitals for named stars (`α SIRIUS`). They fade in after the lines finish drawing.

### Coin labels (radar)
The symbol in starlight-dim mono and the net APR in starlight, or in orange when alerting. Projected from the 3D radar each frame as plain DOM, never drei `<Html>` (see Don'ts).

### The reading
The loudest coin, called out from the radar. A thin leader line draws from the coin to outside the ring. Then a caption ("LOUDEST CLEAN SCENT"), the symbol in display type, the net APR as a figure and a SourceTag gather out of 2px star specks, dim and slightly soft at first, then crisp. Scroll-locked and reversible.

### Symbol carousel
`@spell/logos-carousel` showing the coins the hound is watching, in groups of five, with a staggered rise in and out. Each symbol shows its net APR underneath, orange if alerting. The featured coin is excluded, and one SourceTag covers the carousel.

### Shimmer title
`@spell/shimmer-text` wrapping the display title. The shimmer contrast is pure white, and the base colour is starlight at 0.82.

### Signature: the bite crawl
The scene-to-scene transition, done as a post effect plus matching DOM masks.
- As you scroll, a ragged front rises.
- Every 4px cell (plus 14px chunks) has its own fixed moment to be bitten.
- Once bitten, a cell stays gone, so each bit of scroll adds new bite marks.
- The eaten area shows sparse stars that shimmer only while you scroll.
- The next scene rebuilds the same way, cell by cell.
- Default grain is fine dither; a blockier "pixel" mode exists but isn't the default.

### Signature: the glass hound
The extruded hound mark in a custom glass shader:
- nearly invisible body
- soft Fresnel rim
- stars refracted through it with only a hint of dispersion
- one highlight that follows the cursor

It never animates by itself. On scroll it recedes exponentially (slow, then faster and smaller) and the constellation's stars burst out where it vanished. The mark itself is draft art that still needs a proper drawing.

## Do's and Don'ts

### Do:
- Lock every transition to the scroll position; nothing moves on its own while the page is still.
- Put copy straight on the sky; keep instruments on the opposite side from copy.
- Use real astronomy (J2000 positions, Bayer letters, Sirius' real RA/DEC) as the ornament.
- Let entrances grow from where they connect: from a line, from star specks, from below the screen.
- Tag every figure with its source.
- Author shader colours in sRGB and convert to linear before writing, because the post pipeline is linear.

### Don't:
- **No bloom, no glow halos, no haze, no fog bands.** "The bloom looks cheap."
- **No cards, panels or glass behind copy.** The only glass object is the hound.
- **No sliding gradient masks pretending to be pixels.** Bites must appear cell by cell.
- **No red or green, no price moves, no invented highs or lows.** The scanner measures funding, not price.
- **No drei `<Html>` for labels whose data refreshes.** Its separate React roots can orphan, leaving a frozen copy on screen. Project plain DOM instead.
- **No offsetting content inside a masked or filtered element.** The mask clips at the element's box. Offset the element itself.
- **No third font, no Roman numerals, no decorative use of cyan or orange.**
