import {
  deleteApiAdminSubmissionsSubmissionId,
  deleteApiAdminSubmissionsBuildingBuildingId,
  deleteApiAdminSubmissionsSubmissionIdAssignment,
  getApiAdminSubmissions,
  getApiAdminSubmissionsSubmissionId,
  patchApiAdminSubmissionsSubmissionIdAssignment,
  postApiAdminSubmissionsSubmissionIdAccept,
  postApiAdminSubmissionsSubmissionIdDecline,
  type GetApiAdminSubmissions200DataItem,
  type GetApiAdminSubmissionsSubmissionId200,
  type GetApiAdminSubmissionsSubmissionId200HistoryItem,
  type GetApiAdminSubmissionsSubmissionId200UsedConfig,
  type GetApiAdminSubmissionsParams,
} from "@/api/api.gen";
import type { DETInput } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { RecordStatus, SubmissionSummary } from "@/assets/types";
import {
  toDetailStatus,
  toRecordStatus,
} from "@/lib/submissionStatus";

export { toDetailStatus } from "@/lib/submissionStatus";

export type SubmissionDetail = {
  id: string;
  buildingId: string;
  buildingAddress: string;
  longitude: number;
  latitude: number;
  receivedDate: string;
  status: RecordStatus;
  assignedToId: string | null;
  assignedTo: string | null;
  assignedAt: string | null;
  otherSubmissionIds: string[];
  currentAcceptedSubmissionId: string | null;
  allSubmissionsDeclined: boolean;
  submissionCount: number;
  history: GetApiAdminSubmissionsSubmissionId200HistoryItem[];
  usedConfig: GetApiAdminSubmissionsSubmissionId200UsedConfig;
  detInput: DETInput | undefined;
};

function groupToSummaries(group: GetApiAdminSubmissions200DataItem): SubmissionSummary[] {
  const useVariants = group.submissions.length > 1;
  const orderedSubmissions = [...group.submissions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return orderedSubmissions.map((sub, i) => ({
    id: sub.id,
    buildingId: group.buildingId,
    buildingAddress: group.address,
    longitude: group.longitude,
    latitude: group.latitude,
    receivedDate: sub.createdAt,
    status: toRecordStatus(sub.status),
    assignedTo: sub.assignedToId,
    ...(useVariants && {
      variantGroup: group.buildingId,
      variantLabel: `Einreichung ${String.fromCharCode(65 + i)}`,
    }),
  }));
}

function toSubmissionDetail(data: GetApiAdminSubmissionsSubmissionId200): SubmissionDetail {
  return {
    id: data.id,
    buildingId: data.buildingId,
    buildingAddress: data.address,
    longitude: data.longitude,
    latitude: data.latitude,
    receivedDate: data.createdAt,
    status: toDetailStatus(data.status),
    assignedToId: data.assignedTo?.id ?? null,
    assignedTo: data.assignedTo
      ? [data.assignedTo.given_name, data.assignedTo.family_name].filter(Boolean).join(" ") || data.assignedTo.email
      : null,
    assignedAt: data.assignedAt,
    otherSubmissionIds: data.otherSubmissionIds,
    currentAcceptedSubmissionId: data.currentAcceptedSubmissionId,
    allSubmissionsDeclined: data.allSubmissionsDeclined,
    submissionCount: data.submissionCount,
    history: data.history,
    usedConfig: data.usedConfig,
    detInput: data.raw as DETInput | undefined,
  };
}

export function useSubmissions(params?: GetApiAdminSubmissionsParams) {
  return useQuery({
    queryKey: ["submissions", params],
    queryFn: () => getApiAdminSubmissions(params),
    select: (data) => data.data.flatMap(groupToSummaries),
    staleTime: 30_000,
  });
}

export function useSubmission(submissionId: string) {
  return useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => getApiAdminSubmissionsSubmissionId(submissionId),
    enabled: !!submissionId,
    select: toSubmissionDetail,
    staleTime: 30_000,
  });
}

export function useDeleteSubmission() {
  return useMutation({
    mutationFn: ({ submissionId }: { submissionId: string }) =>
      deleteApiAdminSubmissionsSubmissionId(submissionId),
  });
}

export function useDeleteBuildingSubmissions() {
  return useMutation({
    mutationFn: ({ buildingId }: { buildingId: string }) =>
      deleteApiAdminSubmissionsBuildingBuildingId(buildingId),
  });
}

export function useAssignSubmission() {
  return useMutation({
    mutationFn: ({
      submissionId,
      userId,
    }: {
      submissionId: string;
      userId: string;
    }) =>
      patchApiAdminSubmissionsSubmissionIdAssignment(submissionId, { userId }),
  });
}

export function useUnassignSubmission() {
  return useMutation({
    mutationFn: ({ submissionId }: { submissionId: string }) =>
      deleteApiAdminSubmissionsSubmissionIdAssignment(submissionId),
  });
}

export function useAcceptSubmission() {
  return useMutation({
    mutationFn: ({
      submissionId,
      comment,
    }: {
      submissionId: string;
      comment?: string;
    }) => postApiAdminSubmissionsSubmissionIdAccept(submissionId, { comment }),
  });
}

export function useDeclineSubmission() {
  return useMutation({
    mutationFn: ({
      submissionId,
      comment,
    }: {
      submissionId: string;
      comment: string;
    }) => postApiAdminSubmissionsSubmissionIdDecline(submissionId, { comment }),
  });
}
