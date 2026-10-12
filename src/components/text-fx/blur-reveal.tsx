import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}

/**
 * Text/blocks resolve from blur + rise on scroll into view (ported from WhaleHunterAlt).
 * Use for sheet cards only. Never on elements that a chapter's GSAP timeline animates (T03b rule).
 * motion owns this micro-interaction. Reduced motion renders the content static.
 */
export function BlurReveal({ children, delay = 0, className, y = 28 }: Props) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
