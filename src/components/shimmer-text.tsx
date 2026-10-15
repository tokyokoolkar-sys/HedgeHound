"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

type Variant = "default"

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  duration?: number;
  delay?: number;
  spread?: number;
}

// One variant: the site's starlight. The kit's coloured variants (red, green, …) were removed in the P4 close.
const variantMap: Record<Variant, string> = { default: "" };

export function ShimmerText({
  children,
  className,
  variant = "default",
  duration = 1.5,
  delay = 1.5,
  still = false,
}: ShimmerTextProps & { still?: boolean }) {
  return (
    // HedgeHound: no overflow clip, and the painted box is padded past the ink (descenders, italic
    // overhang) with matching negative margins, so background-clip:text never cuts a glyph. The upstream
    // `dark:` contrast (black) is removed: this site's `dark` variant always applies, and the sweep must be
    // a white glint (DESIGN.md "Shimmer title").
    <div className="group">
      <div>
        <motion.div
          data-shimmer
          className={cn(
            "-mx-[0.08em] -mb-[0.22em] inline-block px-[0.08em] pb-[0.22em] [--shimmer-contrast:rgba(255,255,255,0.6)]",
            variantMap[variant],
            className,
          )}
          style={{
            WebkitTextFillColor: "transparent",
            background:
              "currentColor linear-gradient(to right, currentColor 0%, var(--shimmer-contrast) 40%, var(--shimmer-contrast) 60%, currentColor 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            backgroundRepeat: "no-repeat",
            backgroundSize: "50% 200%",
          } as React.CSSProperties}
          initial={{
            backgroundPositionX: "250%",
          }}
          animate={still ? undefined : {
            backgroundPositionX: ["-100%", "250%"],
          }}
          transition={{
            duration: duration,
            delay: delay,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: "linear",
          }}
        >
          <span>{children}</span>
        </motion.div>
      </div>
    </div>
  );
}

export default ShimmerText;
