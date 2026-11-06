import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Link } from "@/lib/nav"
import { PaperDetail } from "@/components/den/paper-detail"

export const metadata: Metadata = { title: "Paper ticket" }
export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const ticket = await prisma.paperTicket.findUnique({
    where: { id },
    include: { outcome: true },
  })

  if (!ticket) notFound()

  return (
    <main className="min-h-svh px-[max(16px,7vw)] py-24">
      <Link to="/den/paper" className="label inline-flex min-h-11 items-center text-starlight-dim">
        back to the ledger
      </Link>

      <p className="label m-0 mt-4 text-starlight-dim">
        {ticket.side} · ${ticket.notionalUsd} · {ticket.leverage}× · {ticket.holdHours}h
      </p>
      <h1 className="m-0 font-light-display text-title">{ticket.symbol}</h1>

      <PaperDetail
        ticket={{
          id: ticket.id,
          symbol: ticket.symbol,
          side: ticket.side,
          notionalUsd: ticket.notionalUsd,
          leverage: ticket.leverage,
          holdHours: ticket.holdHours,
          note: ticket.note,
        }}
        outcome={
          ticket.outcome
            ? {
                note: ticket.outcome.note,
                status: ticket.outcome.status,
                openedAt: ticket.outcome.openedAt.toISOString(),
              }
            : null
        }
      />
    </main>
  )
}
