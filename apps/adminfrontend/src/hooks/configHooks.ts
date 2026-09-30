import {
  deleteApiAdminConfigVersionName,
  getApiAdminConfig,
  getApiAdminConfigVersionName,
  getApiPublicConfigActive,
  patchApiAdminConfigVersionNameActivate,
  postApiAdminConfig,
} from "@/api/api.gen";
import type { DETConfig } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { SubsidyWrapper } from "./store";

export type { GetApiAdminConfig200ConfigsItem as ConfigMeta } from "@/api/api.gen";

export function useSaveConfig() {
  return useMutation({
    mutationFn: ({
      versionName,
      config,
      subsidies,
    }: {
      versionName: string;
      config: DETConfig;
      subsidies: SubsidyWrapper[];
    }) =>
      postApiAdminConfig({
        versionName,
        calculationConfig: JSON.stringify(config),
        subsidies: subsidies.map((subsidy) => JSON.stringify(subsidy)),
      }),
  });
}

export function useConfigVersions() {
  return useQuery({
    queryKey: ["config-versions"],
    queryFn: () => getApiAdminConfig(),
  });
}

export function useLoadConfig(versionName: string) {
  return useQuery({
    queryKey: ["config", versionName],
    queryFn: () => getApiAdminConfigVersionName(versionName),
    enabled: !!versionName,
  });
}

export function useActivateConfig() {
  return useMutation({
    mutationFn: ({ versionName }: { versionName: string }) =>
      patchApiAdminConfigVersionNameActivate(versionName),
  });
}

export function useDeleteConfig() {
  return useMutation({
    mutationFn: ({ versionName }: { versionName: string }) =>
      deleteApiAdminConfigVersionName(versionName),
  });
}

export function useActiveConfig() {
  return useQuery({
    queryKey: ["active-config"],
    queryFn: () => getApiPublicConfigActive(),
  });
}
