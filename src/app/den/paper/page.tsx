import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { Link } from "@/lib/nav"

export const metadata: Metadata = { title: "Paper ledger" }
export const dynamic = "force-dynamic"

export default async function Page() {
  const tickets = await prisma.paperTicket.findMany({
    orderBy: { createdAt: "asc" },
    include: { outcome: true },
  })

  return (
    <main className="min-h-svh px-[max(16px,7vw)] py-24">
      <p className="label m-0 text-starlight-dim">the den · paper</p>
      <h1 className="m-0 font-light-display text-title">Paper ledger</h1>

      {tickets.length === 0 ? (
        <p className="mt-6 text-starlight-dim">No paper tickets yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-2">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                to={`/den/paper/${ticket.id}`}
                className="label flex min-h-11 items-center gap-4 border-b border-starlight-faint text-starlight"
              >
                <span className="w-16">{ticket.symbol}</span>
                <span className="w-16 text-starlight-dim">{ticket.side}</span>
                <span className="w-24 text-starlight-dim">${ticket.notionalUsd}</span>
                <span className="text-starlight-dim">{ticket.outcome ? "reviewed" : "no review"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
