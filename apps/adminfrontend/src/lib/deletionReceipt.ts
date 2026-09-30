import type {
  DeleteApiAdminSubmissionsBuildingBuildingId200Receipt,
  DeleteApiAdminSubmissionsSubmissionId200Receipt,
} from "@/api/api.gen";

export type DeletionReceipt =
  | DeleteApiAdminSubmissionsSubmissionId200Receipt
  | DeleteApiAdminSubmissionsBuildingBuildingId200Receipt;

export function downloadDeletionReceipt(receipt: DeletionReceipt) {
  const blob = new Blob([JSON.stringify(receipt, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `loeschbeleg-${receipt.auditEventId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
