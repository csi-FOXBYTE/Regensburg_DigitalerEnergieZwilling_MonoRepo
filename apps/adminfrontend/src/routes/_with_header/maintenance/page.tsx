import { Dashboard } from "@/features/TriageView/Triage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_with_header/maintenance/")({
  component: MaintenancePage,
});

function MaintenancePage() {
  return <Dashboard />;
}
