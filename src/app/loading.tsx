export default function Loading() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-svh flex-col justify-center gap-4 px-[max(16px,7vw)]"
    >
      <p className="label m-0 text-starlight-dim">loading</p>
      <p className="m-0 max-w-prose text-starlight-dim">The sky is coming into focus.</p>
    </main>
  )
}
