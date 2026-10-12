import { createFileRoute } from "@tanstack/react-router";
import { HeroFilm } from "@/components/hero-film";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main>
      <HeroFilm />
    </main>
  );
}
