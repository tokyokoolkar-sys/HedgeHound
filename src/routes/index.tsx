import { createFileRoute } from "@tanstack/react-router";
import { Edition } from "@/components/edition/edition";

export const Route = createFileRoute("/")({
  component: Edition,
});
