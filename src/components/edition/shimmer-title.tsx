// Display title with the owner-chosen @spell/shimmer-text sweep (DESIGN.md "Shimmer title").
// Base colour starlight at 0.82, shimmer contrast pure white.
import type { ReactNode } from "react"
import { ShimmerText } from "@/components/shimmer-text"
import { cn } from "@/lib/cn"

type Props = {
  as?: "h1" | "h2" | "p"
  /** Type role: hero (overture), chapter, or title. */
  size?: "hero" | "chapter" | "title"
  className?: string
  children: ReactNode
}

const SIZE = { hero: "text-hero", chapter: "text-chapter", title: "text-title" } as const

export function ShimmerTitle({ as: Tag = "h2", size = "chapter", className, children }: Props) {
  return (
    <ShimmerText className="text-starlight/82 [--shimmer-contrast:rgb(255_255_255)]" duration={2.4} delay={0.8}>
      <Tag className={cn(SIZE[size], "font-light-display m-0", className)}>{children}</Tag>
    </ShimmerText>
  )
}
