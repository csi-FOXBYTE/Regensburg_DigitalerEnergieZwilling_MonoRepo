type UserWithRoles = {
  resource_access?: Record<string, { roles: string[] }>;
};

// Mirrors the backend's config.middleware.ts read permissions.
const PAGES = [
  {
    label: "Dashboard",
    path: "/dashboard",
    roles: ["admin", "manager"],
    routeIds: ["/_with_header/dashboard/"],
  },
  {
    label: "Gebäudeliste",
    path: "/maintenance",
    roles: ["admin", "manager"],
    routeIds: ["/_with_header/maintenance/", "/_with_header/record/$id/"],
  },
  {
    label: "Systempflege",
    path: "/config",
    roles: ["admin", "maintainer"],
    routeIds: ["/_with_header/config/"],
  },
] as const;

export type PagePath = (typeof PAGES)[number]["path"];

export function getAvailablePages(user: UserWithRoles | null | undefined) {
  const roles = user?.resource_access?.["digital-energy-twin"]?.roles ?? [];
  return PAGES.filter((page) =>
    page.roles.some((role) => roles.includes(role)),
  );
}

export function getPageForMatches(
  matches: readonly { routeId: string }[],
): PagePath | undefined {
  return PAGES.find((page) =>
    matches.some((match) =>
      page.routeIds.some((routeId) => routeId === match.routeId),
    ),
  )?.path;
}
