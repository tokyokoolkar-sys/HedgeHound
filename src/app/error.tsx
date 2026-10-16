"use client"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-svh flex-col justify-center gap-4 px-[max(16px,7vw)]">
      <p className="label m-0 text-scent">error</p>
      <h1 className="m-0 font-light-display text-title">Something went wrong</h1>
      <p className="m-0 max-w-prose text-starlight-dim">{error.message || "Try reloading the page."}</p>
      <button type="button" onClick={reset} className="label inline-flex min-h-11 items-center text-starlight">
        try again
      </button>
    </main>
  )
}
