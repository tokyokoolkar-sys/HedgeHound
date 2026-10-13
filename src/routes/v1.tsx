import { createFileRoute } from "@tanstack/react-router";
import { HeroFilm } from "@/components/hero-film";

// The legacy (Grok-built) home, parked here by T13 decision 1a until it is deleted in T51.
export const Route = createFileRoute("/v1")({
  component: () => (
    <main>
      <HeroFilm />
    </main>
  ),
});
