# HedgeHound

**A funding-spread observatory in a real night sky.**

HedgeHound is the front end for a local scanner that watches funding rates on two crypto perpetual venues, **Lighter** and **Binance Futures**, and finds coins where the hourly funding disagrees between them. It presents that as **"The Can✶s Edition"**: a long, scroll-driven website where the sky is the interface, coins are stars, and the scanner is a radar sweeping the dark.

> **Phase 0: paper only.** HedgeHound never places trades. There is no order code, no exchange keys, and none will be added in this phase. Not financial advice.

---

## The idea in one paragraph

Perpetual futures charge or pay a small **funding rate** every hour (or every few hours). Two venues often charge different rates for the same coin. If you are **long the coin where funding is cheap and short it where funding is rich**, with about the same size on both sides, the price moves cancel out and what's left is the **spread**. It only counts if that spread is real after costs and if it **stays**. The hound "sniffs" for those spreads; the human decides whether any of them is worth acting on.

## What the website is

The site is one long scroll through a night sky, chapter by chapter. Each chapter has an **instrument** in the sky (3D, on one side) and a few lines of **copy straight on the sky** (on the other side). Scrolling drives everything: transitions move only while you scroll and stop when you stop.

| | Chapter | What you see |
|---|---|---|
| — | **Overture** | A glass hound floating in deep space. Its rim catches the light and you can see stars through it. Scroll, and it falls away into the distance. |
| α | **The hound in the sky** | Canis Major, the Greater Dog, drawn from the stars' real positions. The stars burst out where the hound vanished, the lines draw in, and the Greek star letters appear (α Sirius, β Mirzam…). |
| ↓ | *transition* | The scene gets **eaten away** pixel by pixel as you scroll, into a field of shimmering stars. The coins the scanner is watching cycle past, each with its net APR. Then the next scene is rebuilt the same way. |
| β | **Sniff** | A radar. Coins sit around it, and the stronger the spread, the closer to the centre. A cyan sweep pings them. The loudest reading draws a line out from its coin and gathers out of star specks. Three principles explain the method: **Normalize, Cancel, Doubt**. |
| γ–κ | *(planned)* | One coin with two legs · The Trail (does it stay?) · The Hedge · The Kennel (meme coins) · Cold Embers (what's filtered out and why) · The Sky (every coin charted) · The Den (paper desk) · Ledger. |

**Every number on screen carries a tag** saying where it came from:
- **LIVE** means it came from the scanner, with the time.
- **PAPER** means it came from the local paper book.
- **SAMPLE** is a labelled fallback, shown when the scanner is off.

Nothing is invented: no yields, no testimonials, no track record.

### The look, briefly
- Near-black sky and crisp stars. No glow, no bloom, no cards behind the text.
- Two typefaces: **Noto Serif Display** at its thinnest for titles and copy (ancient Greek star-atlas feel, modern finish) and **JetBrains Mono** for labels and data.
- Two signal colours, each with a fixed meaning: **cyan** for scanning and the long leg, **orange** for alerts and the short leg.
- Real astronomy as ornament: Sirius sits at RA 06h 45m 09s · DEC −16° 43′, the home coordinate shown in the corner.

The full design system, starting with the owner's taste, is in **[DESIGN.md](DESIGN.md)**.

---

## Run it locally

You need Node 22+ and Python 3. Everything runs on your own machine.

```bash
npm install
npm run dev
```

Open **http://localhost:8080**. With the scanner off, the site shows clearly labelled SAMPLE data.

To see live data, start the scanner in a second terminal. It lives in the sibling project `WhaleHunterAlt`:

```bash
python E:\ataspace\WhaleHunterAlt\scanner\server.py
```

The scanner serves `http://127.0.0.1:8000/api/scan`, which the dev server proxies as `/api`. Figures switch from SAMPLE to LIVE once it has finished its first poll (it polls every 5 minutes).

Checks: `npm run typecheck`, `npm run lint`, `npm test`. More detail is in [docs/redesign/RUNBOOK.md](docs/redesign/RUNBOOK.md).

### Direction prototype
The current look was decided on a live prototype at **`/_almagest`**, on the branch **`D1-almagest`**:

```bash
git checkout D1-almagest
```

Then run `npm run dev` and open http://localhost:8080/_almagest. It has switches for the typeface and the transition grain.

## Stack

TanStack Start (React 19, SSR) · Vite · Tailwind v4 · three.js + React Three Fiber (one persistent canvas) · custom GLSL (stars, glass, the "bite" transition) · Lenis + GSAP ticker for smooth scroll · TanStack Query for the scanner feed · shadcn/ui, magicui and two `@spell` components (shimmer text, logos carousel).

## Project docs

| File | What it is |
|---|---|
| [DESIGN.md](DESIGN.md) | The design system and the owner's taste. Binding for look and motion |
| [PRODUCT.md](PRODUCT.md) | Product purpose, users and the honesty rules |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Where the project is and what comes next |
| [docs/redesign/PLAN.md](docs/redesign/PLAN.md) | The redesign plan: architecture, chapters, rules |
| [docs/redesign/TICKETS.md](docs/redesign/TICKETS.md) | Tickets and their status |
| [CLAUDE.md](CLAUDE.md) | Rules for the AI agents working on this repo |

## Status

Version **v0.3** (foundation phase). See [docs/ROADMAP.md](docs/ROADMAP.md).
