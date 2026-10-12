import { type ComponentPropsWithoutRef, type CSSProperties, type FC } from "react";

import { cn } from "@/lib/cn";
import "./animated-shiny-text.css";

// Ported from magicui animated-shiny-text (src/components/ui, moved here in T03b).
// Colours are HedgeHound tokens (text-muted, fg), not the registry's neutral palette.
// The keyframes are in animated-shiny-text.css. Reduced motion stops the shimmer there.

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        "mx-auto max-w-md text-muted/70",

        // Shine effect
        "text-fx-shiny bg-size-[var(--shiny-width)_100%] bg-clip-text bg-position-[0_0] bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]",

        // Shine gradient
        "bg-linear-to-r from-transparent via-fg/80 via-50% to-transparent",

        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
