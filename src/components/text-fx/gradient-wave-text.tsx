import { cn } from "@/lib/cn";
import "./gradient-wave-text.css";

interface Props {
  children: string;
  className?: string;
}

/**
 * Display type with a slow gradient wave sweeping across it (pure CSS).
 * Colours: starlight and dim tones only (see gradient-wave-text.css). Reduced motion stops the wave.
 */
export function GradientWaveText({ children, className }: Props) {
  return (
    <span aria-label={children} className={cn("gradient-wave-text", className)}>
      {children}
    </span>
  );
}
