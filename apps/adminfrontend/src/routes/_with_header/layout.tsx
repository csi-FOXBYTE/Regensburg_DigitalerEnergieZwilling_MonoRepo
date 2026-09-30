import { AppHeader } from "@/components/AppHeader";
import { PageAccess } from "@/components/PageAccess";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_with_header")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <AppHeader />
      <PageAccess>
        <Outlet />
      </PageAccess>
    </>
  );
}
