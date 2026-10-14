import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { band, smooth } from "@/lib/motion/math";
import { afterScroll } from "@/lib/motion/scroll-bus";
import { useSection } from "@/lib/motion/scroll-progress";
import { useRequestSky } from "@/lib/stage/request-sky";
import { EMPTY_SCENE, useStage } from "@/lib/stage/store";

// Throwaway check page for T12 (the sky stage). Deleted in T52.
// It maps section progress onto scene channels with the D1 values; T14 owns this mapping for real.
export const Route = createFileRoute("/_stage")({
  head: () => ({ meta: [{ title: "HedgeHound · /_stage (T12 check)" }] }),
  component: StagePage,
});

function Spacer({ id, length }: { id: string; length: string }) {
  const ref = useSection(id);
  return <section ref={ref} aria-label={id} style={{ height: length }} />;
}

function StagePage() {
  useRequestSky("edition");

  useEffect(() => {
    const map = () => {
      const s = useStage.getState();
      const h = s.sections.overture ?? 0;
      const a = s.sections.canis ?? 0;
      const c = s.sections.crawl ?? 0;
      const reduced = s.reduced;
      s.set({
        transition: c,
        scene: {
          ...EMPTY_SCENE,
          houndAway: reduced ? (h > 0.5 ? 1 : 0) : band(h, 0.12, 1),
          canisOn: h > 0.5 && c < 0.5 ? 1 : 0,
          canisForm: reduced ? 1 : band(a, 0, 0.42),
          canisLines: reduced ? 1 : band(a, 0.22, 0.5),
          canisLabels: reduced ? 1 : band(a, 0.38, 0.5) * (1 - band(a, 0.8, 0.95)),
          canisAway: reduced ? 0 : smooth(band(a, 0.78, 1)) * 0.6 + smooth(band(c, 0, 0.5)) * 0.4,
          flight: h * 6 + a * 10 + c * 18,
        },
      });
    };
    afterScroll.add(map);
    return () => {
      afterScroll.delete(map);
      useStage.getState().set({ transition: 0 });
    };
  }, []);

  return (
    <main className="relative z-10">
      <div className="pointer-events-none fixed left-6 top-20">
        <p className="label text-starlight-dim">/_stage · T12 sky stage check</p>
        <p className="label mt-2 text-starlight-dim">scroll: hound → Canis Major → bite crawl</p>
      </div>
      <Spacer id="overture" length="170svh" />
      <Spacer id="canis" length="300svh" />
      <Spacer id="crawl" length="190svh" />
      <section aria-label="end" style={{ height: "100svh" }} />
    </main>
  );
}
