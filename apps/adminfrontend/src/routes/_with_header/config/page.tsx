import { ConfigOverview } from "@/features/SystemMaintenance/ConfigOverview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_with_header/config/")({
  component: ConfigPage,
});

function ConfigPage() {
  return <ConfigOverview />;
}
