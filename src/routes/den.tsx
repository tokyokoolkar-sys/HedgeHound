import { createFileRoute } from "@tanstack/react-router";
import { DenDesk } from "@/components/den-desk";

export const Route = createFileRoute("/den")({
  component: DenPage,
});

function DenPage() {
  return (
    <main className="night min-h-dvh">
      <DenDesk />
    </main>
  );
}
