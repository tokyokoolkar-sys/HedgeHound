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

// Throwaway specimen route (T04 / T03 / T03b). Deleted in T52.
// Placeholder content only: no APR, yield or performance figures.
export const Route = createFileRoute("/_kitchen")({
  component: KitchenPage,
});

const faces: Array<{ name: string; family: string; role: string; sample: string; weights: number[]; italic?: boolean }> = [
  {
    name: "Bricolage Grotesque Variable",
    family: "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif",
    role: "Mega chapter titles (PLAN 2.3)",
    sample: "Sniff the spread",
    weights: [200, 400, 700, 800],
  },
  {
    name: "JetBrains Mono Variable",
    family: "'JetBrains Mono Variable', ui-monospace, monospace",
    role: "Data, HUD and labels (PLAN 2.3)",
    sample: "0123456789 · 00.00% · persist 0.00",
    weights: [100, 400, 700, 800],
  },
  {
    name: "Pinyon Script",
    family: "'Pinyon Script', cursive",
    role: "Swash initial on subtitles (PLAN 2.3)",
    sample: "The Hound",
    weights: [400],
  },
  {
    name: "Syne Variable",
    family: "'Syne Variable', ui-sans-serif, system-ui, sans-serif",
    role: "Wordmark only (PLAN 2.3)",
    sample: "Hedge Hound",
    weights: [400, 700, 800],
  },
  {
    name: "Fraunces Variable",
    family: "'Fraunces Variable', Palatino, 'Palatino Linotype', serif",
    role: "Editorial subtitles and body (PLAN 2.3)",
    sample: "Why the hedge holds",
    weights: [300, 400],
    italic: true,
  },
];

function KitchenPage() {
  return (
    <main className="min-h-dvh px-4 py-10 md:px-10">
      <h1 className="mb-2 text-2xl font-bold">/_kitchen</h1>
      <p className="mb-10 max-w-prose text-muted">
        Specimens for T03 (shadcn and magicui) and T04 (fonts). Throwaway route, deleted in T52.
      </p>

      <Section title="Fonts (T04)">
        <div className="flex flex-col gap-12">
          {faces.map((face) => (
            <div key={face.name}>
              <h3 className="mb-1 font-mono text-xs tracking-[0.14em] text-faint uppercase">
                {face.name} · {face.role}
              </h3>
              <div className="flex flex-col gap-3">
                {face.weights.map((w) => (
                  <p
                    key={w}
                    className="text-5xl leading-tight"
                    style={{
                      fontFamily: face.family,
                      fontWeight: w,
                      fontStyle: face.italic ? "italic" : "normal",
                    }}
                  >
                    {face.sample}
                    <span className="ml-4 align-middle font-mono text-xs text-faint">{w}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="mb-6 border-b pb-2 font-mono text-sm tracking-[0.14em] uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 font-mono text-xs text-faint">{label}</h3>
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
