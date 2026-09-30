import { getApiAdminAuthVerify } from "@/api/api.gen";
import type { GetApiAdminAuthVerify200AccessToken } from "@/api/api.gen";
import { useQuery } from "@tanstack/react-query";
import { getAvailablePages } from "@/lib/pageAccess";

export type CurrentUser = GetApiAdminAuthVerify200AccessToken;

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: ["/api/admin/auth/verify"],
    queryFn: getApiAdminAuthVerify,
    retry: false,
  });
}

export function useCurrentUser(): CurrentUser | null {
  const { data, isSuccess } = useCurrentUserQuery();
  return isSuccess ? data.accessToken : null;
}

export function useAvailablePages() {
  return getAvailablePages(useCurrentUser());
}

export function getDisplayName(user: CurrentUser | null | undefined): string {
  return user?.name ?? user?.email ?? "Unbekannt";
}
