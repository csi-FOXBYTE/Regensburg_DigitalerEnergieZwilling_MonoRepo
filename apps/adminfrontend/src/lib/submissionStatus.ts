import type { RecordStatus } from "../assets/types.ts";

export type BackendSubmissionStatus =
  | "NEW"
  | "ASSIGNED"
  | "ACCEPTED"
  | "DECLINED"
  | "SUPERSEDED";

export function toRecordStatus(status: BackendSubmissionStatus): RecordStatus {
  switch (status) {
    case "NEW":
      return "NEU";
    case "ASSIGNED":
      return "IN_PRUEFUNG";
    case "ACCEPTED":
      return "FREIGEGEBEN";
    case "DECLINED":
      return "ABGELEHNT";
    case "SUPERSEDED":
      return "ERSETZT";
  }
}

export const toDetailStatus = toRecordStatus;
