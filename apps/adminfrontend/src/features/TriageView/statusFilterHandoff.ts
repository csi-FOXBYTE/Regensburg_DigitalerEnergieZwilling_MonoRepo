import type { RecordStatus } from "@/assets/types";

let pendingStatusFilter: RecordStatus | undefined;

export function setPendingStatusFilter(status: RecordStatus | undefined) {
  pendingStatusFilter = status;
}

export function consumePendingStatusFilter(): RecordStatus | undefined {
  const status = pendingStatusFilter;
  pendingStatusFilter = undefined;
  return status;
}
