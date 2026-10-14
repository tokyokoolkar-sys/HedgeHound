// Display title with the owner-chosen @spell/shimmer-text sweep (DESIGN.md "Shimmer title").
// Base colour starlight at 0.82, shimmer contrast pure white.
import type { ReactNode } from "react"
import { ShimmerText } from "@/components/shimmer-text"
import { cn } from "@/lib/cn"
import { useReducedMotion } from "@/lib/motion/use-reduced-motion"

type Props = {
  as?: "h1" | "h2" | "h3" | "p"
  /** Type role: hero (overture), chapter, or title. */
  size?: "hero" | "chapter" | "title"
  className?: string
  children: ReactNode
}

const SIZE = { hero: "text-hero", chapter: "text-chapter", title: "text-title" } as const

export function ShimmerTitle({ as: Tag = "h2", size = "chapter", className, children }: Props) {
  // Reduced motion: no sweep at all, plain starlight (a frozen gradient would leave the title unevenly lit).
  const still = useReducedMotion()
  const title = <Tag className={cn(SIZE[size], "font-light-display m-0", className)}>{children}</Tag>
  if (still) return <div className="text-starlight/82">{title}</div>
  // The size class also sits on the shimmer wrapper, so its em padding (the room for descenders under
  // background-clip:text) scales with the title instead of the 16px body (P3 critique).
  return (
    <ShimmerText className={cn(SIZE[size], "text-starlight/82 [--shimmer-contrast:rgb(255_255_255)]")} duration={2.4} delay={0.8}>
      {title}
    </ShimmerText>
  )
}
