import { createFileRoute } from "@tanstack/react-router";

// Throwaway specimen route (T04 / T03). Deleted in T52.
// Font faces only. shadcn and magicui showcases come with T03 once it is unblocked.
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
        Font specimens for T04. Throwaway route, deleted in T52.
      </p>
      <div className="flex flex-col gap-12">
        {faces.map((face) => (
          <section key={face.name} aria-labelledby={`face-${face.name.replace(/\s+/g, "-")}`}>
            <h2
              id={`face-${face.name.replace(/\s+/g, "-")}`}
              className="mb-1 font-mono text-xs tracking-[0.14em] text-faint uppercase"
            >
              {face.name} · {face.role}
            </h2>
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
          </section>
        ))}
      </div>
    </main>
  );
}
