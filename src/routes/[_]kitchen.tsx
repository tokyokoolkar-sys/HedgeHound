import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Marquee } from "@/components/magicui/marquee";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { OrbitingCircles } from "@/components/magicui/orbiting-circles";
import { HyperText } from "@/components/magicui/hyper-text";
import { Ripple } from "@/components/magicui/ripple";
import { Meteors } from "@/components/magicui/meteors";
import { BlurReveal } from "@/components/text-fx/blur-reveal";
import { GradientWaveText } from "@/components/text-fx/gradient-wave-text";
import { PerspectiveText } from "@/components/text-fx/perspective-text-scroll";
import { AnimatedShinyText } from "@/components/text-fx/animated-shiny-text";
import { SourceTag } from "@/components/edition/source-tag";
import { LogosCarousel } from "@/components/logos-carousel";
import { ShimmerText } from "@/components/shimmer-text";
import { palette } from "@/lib/palette";

// Throwaway specimen route (T04 / T03 / T03b). Deleted in T52.
// Placeholder content only: the one figure shown is tagged SAMPLE.
export const Route = createFileRoute("/_kitchen")({
  component: KitchenPage,
});


function KitchenPage() {
  return (
    <main className="min-h-dvh bg-void px-4 pt-24 pb-10 text-starlight md:px-10">
      <h1 className="mb-2 text-title font-light-display">/_kitchen</h1>
      <p className="mb-10 max-w-prose text-starlight-dim">
        Specimens for T10 (DESIGN.md tokens and type), T03 (shadcn and magicui) and T03b (text effects). Throwaway route, deleted in T52.
      </p>

      <TokensSection />

      <Section title="shadcn/ui (T03)">
        <div className="flex flex-col gap-10">
          <Row label="button">
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </Row>

          <Row label="badge">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </Row>

          <Row label="card">
            <Card className="w-72">
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Card description</CardDescription>
              </CardHeader>
              <CardContent>Card content.</CardContent>
              <CardFooter>Card footer</CardFooter>
            </Card>
          </Row>

          <Row label="table">
            <div className="w-full max-w-xl">
              <Table>
                <TableCaption>Placeholder rows</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Row A</TableCell>
                    <TableCell>0.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Row B</TableCell>
                    <TableCell>0.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Row>

          <Row label="tabs">
            <Tabs defaultValue="one" className="w-72">
              <TabsList>
                <TabsTrigger value="one">One</TabsTrigger>
                <TabsTrigger value="two">Two</TabsTrigger>
              </TabsList>
              <TabsContent value="one">Tab one content.</TabsContent>
              <TabsContent value="two">Tab two content.</TabsContent>
            </Tabs>
          </Row>

          <Row label="tooltip">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>Tooltip text</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Row>

          <Row label="hover-card">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link">Hover card trigger</Button>
              </HoverCardTrigger>
              <HoverCardContent>Hover card content.</HoverCardContent>
            </HoverCard>
          </Row>

          <Row label="slider">
            <Slider defaultValue={[50]} max={100} step={1} className="w-72" />
          </Row>

          <Row label="sheet">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet title</SheetTitle>
                  <SheetDescription>Sheet description.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </Row>

          <Row label="dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog title</DialogTitle>
                  <DialogDescription>Dialog description.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </Row>

          <Row label="command">
            <Command className="w-72 rounded-md border">
              <CommandInput placeholder="Type to filter" />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
                <CommandGroup heading="Items">
                  <CommandItem>Item A</CommandItem>
                  <CommandItem>Item B</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </Row>

          <Row label="scroll-area">
            <ScrollArea className="h-32 w-72 rounded-md border p-3">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="py-1 text-sm">
                  Line {i + 1}
                </div>
              ))}
            </ScrollArea>
          </Row>

          <Row label="separator">
            <div className="w-72">
              <div>Above</div>
              <Separator className="my-2" />
              <div>Below</div>
            </div>
          </Row>

          <Row label="sonner">
            <Button variant="outline" onClick={() => toast("Sample toast")}>
              Show toast
            </Button>
            <Toaster />
          </Row>

          <Row label="toggle-group">
            <ToggleGroup type="single" variant="outline" defaultValue="a">
              <ToggleGroupItem value="a">A</ToggleGroupItem>
              <ToggleGroupItem value="b">B</ToggleGroupItem>
              <ToggleGroupItem value="c">C</ToggleGroupItem>
            </ToggleGroup>
          </Row>
        </div>
      </Section>

      <Section title="magicui (T03)">
        <div className="flex flex-col gap-10">
          <Row label="number-ticker">
            <NumberTicker value={123} className="text-4xl font-mono" />
          </Row>

          <Row label="border-beam">
            <div className="relative h-32 w-72 rounded-xl border">
              <BorderBeam />
              <div className="p-4 text-sm">Border beam card</div>
            </div>
          </Row>

          <Row label="marquee">
            <Marquee pauseOnHover className="w-72 [--duration:20s]">
              <span className="px-4">Placeholder tape</span>
              <span className="px-4">Placeholder tape</span>
            </Marquee>
          </Row>

          <Row label="animated-beam">
            <BeamDemo />
          </Row>

          <Row label="orbiting-circles">
            <div className="relative flex size-80 items-center justify-center">
              <div className="flex size-12 items-center justify-center rounded-full border">Core</div>
              <OrbitingCircles radius={120} iconSize={36}>
                <div className="size-9 rounded-full border" />
                <div className="size-9 rounded-full border" />
              </OrbitingCircles>
            </div>
          </Row>

          <Row label="hyper-text">
            <HyperText className="text-2xl font-mono">HYPER TEXT DECODE</HyperText>
          </Row>

          <Row label="ripple">
            <div className="relative h-64 w-full max-w-md overflow-hidden rounded-xl border">
              <Ripple />
            </div>
          </Row>

          <Row label="meteors">
            <div className="relative h-40 w-full max-w-md overflow-hidden rounded-xl border">
              <Meteors number={12} />
            </div>
          </Row>
        </div>
      </Section>

      <Section title="text-fx (T03b)">
        <div className="flex flex-col gap-10">
          <Row label="blur-reveal (sheet cards only)">
            <BlurReveal className="w-72 rounded-xl border p-4">Blur reveal card</BlurReveal>
          </Row>

          <Row label="gradient-wave-text">
            <GradientWaveText className="text-4xl font-bold">Gradient wave</GradientWaveText>
          </Row>

          <Row label="animated-shiny-text">
            <AnimatedShinyText className="text-2xl">Shiny text</AnimatedShinyText>
          </Row>

          <Row label="perspective-text-scroll (scrolls inside this box)">
            <div className="h-[70vh] w-full overflow-y-auto rounded-xl border">
              <PerspectiveText />
            </div>
          </Row>
        </div>
      </Section>
    </main>
  );
}

// ---------- T10: DESIGN.md tokens and type ----------

type Swatch = { token: string; color: string; role: string; on: string; minimum: number; kind: "text" | "non-text" | "none" };

const DIM = `rgb(244 241 234 / ${palette.starlightDimAlpha})`;
const FAINT = `rgb(244 241 234 / ${palette.starlightFaintAlpha})`;

// Each swatch is checked against what it is used for: text needs 4.5:1 (WCAG 1.4.3, small text),
// lines and other non-text marks need 3:1 (1.4.11). Faint is for lines only (T10 critique decision).
const SWATCHES: Swatch[] = [
  { token: "--color-void", color: palette.void, role: "the sky; the only background", on: "", minimum: 0, kind: "none" },
  { token: "--color-starlight", color: palette.starlight, role: "titles, primary text", on: "void", minimum: 4.5, kind: "text" },
  { token: "--color-starlight-dim", color: DIM, role: "body, captions, labels", on: "void", minimum: 4.5, kind: "text" },
  { token: "--color-starlight-faint", color: FAINT, role: "lines, ticks, rings only (never text)", on: "void", minimum: 3, kind: "non-text" },
  { token: "--color-chart-line", color: palette.chartLine, role: "constellation lines, radar rings", on: "void", minimum: 3, kind: "non-text" },
  { token: "--color-scan", color: palette.scan, role: "scanning · long leg · Bayer letters · focus", on: "void", minimum: 4.5, kind: "text" },
  { token: "--color-scent", color: palette.scent, role: "alerts · short leg (nothing else is orange)", on: "void", minimum: 4.5, kind: "text" },
  { token: "--color-star-cool", color: palette.starCool, role: "star tint only, never UI", on: "", minimum: 0, kind: "none" },
  { token: "--color-star-warm", color: palette.starWarm, role: "star tint only, never UI", on: "", minimum: 0, kind: "none" },
];

function rgbOf(color: string): [number, number, number, number] {
  if (color.startsWith("#")) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    return [r, g, b, 1];
  }
  const m = color.match(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])] : [0, 0, 0, 1];
}

function luminance([r, g, b]: number[]) {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** Contrast of `fg` (alpha-blended) over the void. */
function contrastOnVoid(fg: string) {
  const [r, g, b, a] = rgbOf(fg);
  const [vr, vg, vb] = rgbOf(palette.void);
  const blended = [r * a + vr * (1 - a), g * a + vg * (1 - a), b * a + vb * (1 - a)];
  const [hi, lo] = [luminance(blended), luminance([vr, vg, vb])].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Placeholder symbols only: no figures here, so nothing to tag.
const CAROUSEL = ["ARB", "SUI", "WIF", "SEI", "TIA", "OP", "INJ", "NEAR", "APT", "ETH"];

function TokensSection() {
  return (
    <Section title="Tokens and type (T10 · DESIGN.md)">
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {SWATCHES.map((s) => {
          const ratio = s.minimum ? contrastOnVoid(s.color) : null;
          const pass = ratio === null || ratio >= s.minimum;
          return (
            <div key={s.token} className="flex items-start gap-4">
              <span className="mt-1 size-9 shrink-0 rounded-full border border-starlight/15" style={{ background: s.color }} />
              <div>
                <p className="label text-starlight">{s.token}</p>
                <p className="mt-1 text-sm text-starlight-dim">{s.role}</p>
                {ratio !== null && (
                  <p className={`label mt-1 ${pass ? "text-starlight-dim" : "text-scent"}`}>
                    {ratio.toFixed(1)}:1 on {s.on} · {pass ? "pass" : "fail"} {s.minimum}:1 {s.kind}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 flex flex-col gap-10">
        <div>
          <p className="label mb-3 text-starlight-dim">text-hero · ShimmerText</p>
          <ShimmerText className="[--shimmer-contrast:rgb(255_255_255)]" duration={2.4} delay={0.8}>
            <span className="text-hero font-light-display text-starlight/85">HedgeHound</span>
          </ShimmerText>
        </div>
        <div>
          <p className="label mb-3 text-starlight-dim">text-chapter</p>
          <p className="text-chapter font-light-display">Sniff</p>
        </div>
        <div>
          <p className="label mb-3 text-starlight-dim">text-title</p>
          <p className="text-title font-light-display">The hound in the sky</p>
        </div>
        <div>
          <p className="label mb-3 text-starlight-dim">text-subtitle · italic</p>
          <p className="text-subtitle italic">Every five minutes, the hound lifts its nose.</p>
        </div>
        <div className="max-w-[62ch]">
          <p className="label mb-3 text-starlight-dim">text-body · starlight-dim</p>
          <p className="text-body text-starlight-dim">
            Every coin is a star. Brightness is the spread it carries; a steady light is a spread that stays. Body
            copy sits straight on the sky, with no card behind it.
          </p>
        </div>
        <div>
          <p className="label mb-3 text-starlight-dim">label · figure · bayer</p>
          <p className="label text-starlight-dim">
            <span className="bayer">α</span> · Canis Major · RA 06h 45m 09s · DEC −16° 43′
          </p>
          <p className="figure mt-3">
            ARB <span className="text-scent">35.3% net</span> <SourceTag kind="sample" className="ml-2 align-middle" />
          </p>
        </div>
      </div>

      <div className="mt-16 flex flex-wrap items-center gap-3">
        <p className="label w-full text-starlight-dim">SourceTag states</p>
        <SourceTag kind="sample" />
        <SourceTag kind="paper" />
        <SourceTag kind="live" ts={Date.UTC(2026, 9, 14, 5, 4)} />
        <SourceTag kind="live" ts={Date.UTC(2026, 9, 14, 5, 4)} stale />
      </div>

      <div className="mt-16 overflow-hidden">
        <p className="label mb-6 text-starlight-dim">@spell/logos-carousel · symbols</p>
        <LogosCarousel count={5} stagger={0.12} interval={2200} duration={700} className="gap-5 sm:gap-10">
          {CAROUSEL.map((sym) => (
            <span key={sym} className="label text-base tracking-[0.3em] text-starlight">
              {sym}
            </span>
          ))}
        </LogosCarousel>
      </div>

      <div className="mt-16 flex flex-wrap items-center gap-3">
        <p className="label w-full text-starlight-dim">shadcn mapping: primary = starlight, CTA = starlight hairline, ring = scan</p>
        <Button variant="outline">Open scanner</Button>
        <Button>Primary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Badge variant="outline">Badge</Badge>
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="label mb-6 border-b pb-2 text-starlight">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="label mb-3 text-starlight-dim">{label}</h3>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

function BeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef} className="relative flex h-40 w-80 items-center justify-between rounded-xl border p-6">
      <div ref={fromRef} className="z-10 flex size-10 items-center justify-center rounded-full border">
        A
      </div>
      <div ref={toRef} className="z-10 flex size-10 items-center justify-center rounded-full border">
        B
      </div>
      <AnimatedBeam containerRef={containerRef} fromRef={fromRef} toRef={toRef} />
    </div>
  );
}
