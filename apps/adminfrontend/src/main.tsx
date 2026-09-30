import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { NotFoundPage } from "./components/NotFoundPage";
import { createRoot } from "react-dom/client";
import { setApiAuthProvider, setApiBaseUrl } from "./lib/apiClient";
import { routeTree } from "./routeTree.gen";

setApiBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "");

if (import.meta.env.DEV) {
  setApiAuthProvider(() => import.meta.env.VITE_DEV_ACCESS_TOKEN ?? null);
}

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
