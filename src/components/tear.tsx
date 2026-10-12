import { useId } from "react";
import { cn } from "@/lib/cn";

const FILL =
  "M0 46 L52 24 L104 58 L158 18 L214 62 L276 22 L338 60 L408 16 L470 54 L540 20 L612 66 L684 26 L756 58 L836 14 L910 60 L984 22 L1064 68 L1144 28 L1224 62 L1304 20 L1380 52 L1440 32 L1440 100 L0 100 Z";
const EDGE =
  "M0 46 L52 24 L104 58 L158 18 L214 62 L276 22 L338 60 L408 16 L470 54 L540 20 L612 66 L684 26 L756 58 L836 14 L910 60 L984 22 L1064 68 L1144 28 L1224 62 L1304 20 L1380 52 L1440 32";

export function Tear({
  tone,
  className,
}: {
  tone: "cream" | "dark";
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div
      className={cn("pointer-events-none", tone === "cream" ? "text-cream" : "text-bg", className)}
      aria-hidden
    >
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="block h-16 w-full md:h-24">
        <defs>
          <filter id={id} x="-5%" y="-40%" width="110%" height="180%">
            <feDropShadow dx="0" dy="-1" stdDeviation="1.5" floodColor="var(--color-ink)" floodOpacity="0.35" />
          </filter>
        </defs>
        <path d={FILL} fill="currentColor" filter={`url(#${id})`} />
        <path d={EDGE} fill="none" stroke="var(--color-brand)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
