// Greek Bayer letters inside running label text keep their own case and colour (the Real Glyph Rule): an
// uppercased β reads as a Latin B. Splits a string and wraps each Greek letter in the `bayer` style.
import { Fragment, type ReactNode } from "react"

const GREEK = /([α-ω])/u

export function Greek({ children }: { children: string }): ReactNode {
  return children.split(GREEK).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="bayer">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}
