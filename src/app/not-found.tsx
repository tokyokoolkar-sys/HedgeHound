import { Link } from "@/lib/nav"

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col justify-center gap-4 px-[max(16px,7vw)]">
      <p className="label m-0 text-starlight-dim">404</p>
      <h1 className="m-0 font-light-display text-title">No star at this address</h1>
      <Link to="/" className="label inline-flex min-h-11 items-center text-starlight underline decoration-starlight-faint">
        back to the Edition
      </Link>
    </main>
  )
}
