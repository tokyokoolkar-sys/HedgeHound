import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useSection } from "@/lib/motion/scroll-progress";
import { afterScroll } from "@/lib/motion/scroll-bus";
import { useStage } from "@/lib/stage/store";

// Throwaway check page for T11 (the scroll engine). Deleted in T52.
// Every value on it is engine state, not data: nothing here needs a SourceTag.
export const Route = createFileRoute("/_motion")({
  head: () => ({ meta: [{ title: "HedgeHound · /_motion (T11 check)" }] }),
  component: MotionPage,
});

const SECTIONS = [
  { id: "overture", length: "160svh" },
  { id: "alpha", length: "300svh" },
  { id: "crawl", length: "190svh" },
  { id: "beta", length: "330svh" },
];

function Spacer({ id, length }: { id: string; length: string }) {
  const ref = useSection(id);
  return <section ref={ref} data-section={id} aria-label={id} style={{ height: length }} />;
}

function MotionPage() {
  const hud = useRef<HTMLPreElement>(null);
  const bars = useRef<Array<HTMLDivElement | null>>([]);
  const marker = useRef<HTMLDivElement>(null);

  // Driven from the engine's afterScroll hook: the same per-frame path SkyStage will use in T12.
  useEffect(() => {
    const cb = () => {
      const s = useStage.getState();
      SECTIONS.forEach((sec, i) => {
        const el = bars.current[i];
        if (el) el.style.transform = `scaleX(${s.sections[sec.id] ?? 0})`;
      });
      if (marker.current) {
        // A scroll-locked mover: its position is a pure function of section progress.
        const p = s.sections.alpha ?? 0;
        marker.current.style.transform = `translate3d(${(p * 70).toFixed(2)}vw, 0, 0)`;
      }
      if (hud.current) {
        hud.current.textContent = [
          `active   ${s.active ?? "—"} (#${s.chapter})  ${s.progress.toFixed(3)}`,
          `smooth   ${s.smooth ? "lenis" : "native"}   reduced ${s.reduced}   tier ${s.quality}`,
          `pointer  ${s.pointer[0].toFixed(2)}, ${s.pointer[1].toFixed(2)}`,
          `html.lenis ${document.documentElement.classList.contains("lenis")}`,
        ].join("\n");
      }
    };
    afterScroll.add(cb);
    return () => void afterScroll.delete(cb);
  }, []);

  return (
    <main className="relative bg-void text-starlight">
      <div className="pointer-events-none fixed inset-x-4 top-20 z-10 md:inset-x-10">
        <p className="label text-starlight-dim">/_motion · T11 scroll engine check</p>
        <pre ref={hud} className="figure mt-3 whitespace-pre text-starlight" />
        <div className="mt-6 grid max-w-md gap-2">
          {SECTIONS.map((s, i) => (
            <div key={s.id} className="grid grid-cols-[6rem_1fr] items-center gap-3">
              <span className="label text-starlight-dim">{s.id}</span>
              <div className="h-px bg-starlight-faint">
                <div ref={(el) => void (bars.current[i] = el)} className="h-px origin-left bg-scan" style={{ transform: "scaleX(0)" }} />
              </div>
            </div>
          ))}
        </div>
        <div ref={marker} className="mt-10 size-2 rounded-full bg-starlight" />
        <p className="label mt-3 text-starlight-dim">the dot moves only while α scrolls</p>
      </div>
      {SECTIONS.map((s) => (
        <Spacer key={s.id} id={s.id} length={s.length} />
      ))}
      <section style={{ height: "100svh" }} aria-label="end" />
    </main>
  );
}
