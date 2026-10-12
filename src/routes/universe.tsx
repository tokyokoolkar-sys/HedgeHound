import { createFileRoute } from "@tanstack/react-router";
import { UniverseView } from "@/components/universe-view";

type UniverseSearch = { star?: string };

export const Route = createFileRoute("/universe")({
  validateSearch: (search: Record<string, unknown>): UniverseSearch => {
    const star =
      typeof search.star === "string" && search.star.length > 0 && search.star.length < 24
        ? search.star
        : undefined;
    return { star };
  },
  component: UniversePage,
});

function UniversePage() {
  const { star } = Route.useSearch();
  return (
    <main className="h-dvh overflow-hidden bg-bg">
      <UniverseView initialStar={star} />
    </main>
  );
}
