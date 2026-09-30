import DashboardPage from "@/features/Dashboard/DashboardPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_with_header/dashboard/")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return <DashboardPage />;
}
