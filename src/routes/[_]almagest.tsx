import { createFileRoute } from "@tanstack/react-router";
import { AlmagestPage } from "@/components/spike-almagest/almagest-page";

// Direction spike D1 "Almagest" (throwaway prototype for the owner to scroll and choose from).
export const Route = createFileRoute("/_almagest")({
  validateSearch: (s: Record<string, unknown>): { type?: string; grain?: string } => ({
    type: typeof s.type === "string" ? s.type : undefined,
    grain: typeof s.grain === "string" ? s.grain : undefined,
  }),
  head: () => ({ meta: [{ title: "HedgeHound · Almagest (direction prototype)" }] }),
  component: AlmagestPage,
});
