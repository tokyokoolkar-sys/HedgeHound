"use client"

import { useActionState, useState } from "react"
import {
  hapusTiket,
  tambahCatatan,
  ubahTiket,
  type TicketFormState,
} from "@/app/den/paper/actions"

type Ticket = {
  id: string
  symbol: string
  side: "long" | "short"
  notionalUsd: number
  leverage: number
  holdHours: number
  note: string | null
}

type Outcome = {
  note: string | null
  status: string
  openedAt: string
}

const EMPTY: TicketFormState = {}

const field =
  "mt-1 block w-full border border-starlight-faint bg-transparent px-3 py-2 text-starlight"
const label = "label m-0 block text-starlight-dim"

function Error({ message }: { message?: string }) {
  if (!message) return null
  return <p className="label m-0 mt-2 text-scent">{message}</p>
}

export function PaperDetail({ ticket, outcome }: { ticket: Ticket; outcome: Outcome | null }) {
  const [ubahState, ubahAction, ubahPending] = useActionState(
    ubahTiket.bind(null, ticket.id),
    EMPTY,
  )
  const [catatanState, catatanAction, catatanPending] = useActionState(
    tambahCatatan.bind(null, ticket.id),
    EMPTY,
  )
  const [hapusState, hapusAction, hapusPending] = useActionState(
    hapusTiket.bind(null, ticket.id),
    EMPTY,
  )

  const [note, setNote] = useState(ticket.note ?? "")

  return (
    <div className="mt-10 flex flex-col gap-12">
      <section>
        <h2 className="m-0 font-light-display text-xl text-starlight">Ticket</h2>

        <form action={ubahAction} className="mt-4 flex max-w-md flex-col gap-4">
          <div>
            <label htmlFor="symbol" className={label}>
              Symbol
            </label>
            <input id="symbol" name="symbol" defaultValue={ticket.symbol} className={field} />
            <Error message={ubahState.errors?.symbol?.[0]} />
          </div>

          <div>
            <label htmlFor="side" className={label}>
              Side
            </label>
            <select id="side" name="side" defaultValue={ticket.side} className={field}>
              <option value="long">long</option>
              <option value="short">short</option>
            </select>
            <Error message={ubahState.errors?.side?.[0]} />
          </div>

          <div>
            <label htmlFor="notionalUsd" className={label}>
              Notional (USD)
            </label>
            <input
              id="notionalUsd"
              name="notionalUsd"
              type="number"
              step="0.01"
              defaultValue={ticket.notionalUsd}
              className={field}
            />
            <Error message={ubahState.errors?.notionalUsd?.[0]} />
          </div>

          <div>
            <label htmlFor="leverage" className={label}>
              Leverage
            </label>
            <input
              id="leverage"
              name="leverage"
              type="number"
              step="0.5"
              defaultValue={ticket.leverage}
              className={field}
            />
            <Error message={ubahState.errors?.leverage?.[0]} />
          </div>

          <div>
            <label htmlFor="holdHours" className={label}>
              Hold (hours)
            </label>
            <input
              id="holdHours"
              name="holdHours"
              type="number"
              step="8"
              defaultValue={ticket.holdHours}
              className={field}
            />
            <Error message={ubahState.errors?.holdHours?.[0]} />
          </div>

          <div>
            <label htmlFor="note" className={label}>
              Note
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              maxLength={140}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={field}
            />
            <p className="label m-0 mt-1 text-starlight-dim">{note.length}/140</p>
            <Error message={ubahState.errors?.note?.[0]} />
          </div>

          <div>
            <label className="label flex min-h-11 items-center gap-3 text-starlight-dim">
              <input type="checkbox" name="confirmPaper" defaultChecked />
              This stays paper only
            </label>
            <Error message={ubahState.errors?.confirmPaper?.[0]} />
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={ubahPending} className="label min-h-11 text-starlight">
              {ubahPending ? "saving…" : "save"}
            </button>
            <Error message={ubahState.message} />
          </div>
        </form>
      </section>

      <section>
        <h2 className="m-0 font-light-display text-xl text-starlight">Review</h2>

        {outcome ? (
          <p className="mt-2 text-starlight-dim">
            {outcome.status} · opened {new Date(outcome.openedAt).toLocaleDateString("en-GB")}
          </p>
        ) : (
          <p className="mt-2 text-starlight-dim">No review yet.</p>
        )}

        <form action={catatanAction} className="mt-4 flex max-w-md flex-col gap-4">
          <div>
            <label htmlFor="catatan" className={label}>
              Review note
            </label>
            <textarea
              id="catatan"
              name="catatan"
              rows={3}
              defaultValue={outcome?.note ?? ""}
              className={field}
            />
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={catatanPending} className="label min-h-11 text-starlight">
              {catatanPending ? "saving…" : "save review"}
            </button>
            <Error message={catatanState.message} />
          </div>
        </form>
      </section>

      <section>
        <h2 className="m-0 font-light-display text-xl text-starlight">Delete</h2>
        <form action={hapusAction} className="mt-4 flex items-center gap-4">
          <button type="submit" disabled={hapusPending} className="label min-h-11 text-scent">
            delete ticket
          </button>
          <Error message={hapusState.message} />
        </form>
      </section>
    </div>
  )
}
