import { municipalityDesign } from "@/config/theme";
import type { DETInput } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";

export type RecordStatus =
  | "NEU"
  | "IN_PRUEFUNG"
  | "FREIGEGEBEN"
  | "ABGELEHNT"
  | "ERSETZT";

export interface SubmissionSummary {
  id: string;
  buildingId: string;
  buildingAddress: string;
  longitude: number;
  latitude: number;
  receivedDate: string;
  status: RecordStatus;
  assignedTo: string | null;
  variantGroup?: string;
  variantLabel?: string;
}

export const STATUS_COLORS: Record<RecordStatus, string> = {
  NEU: municipalityDesign.colors.status.new,
  IN_PRUEFUNG: municipalityDesign.colors.status.inReview,
  FREIGEGEBEN: municipalityDesign.colors.status.approved,
  ABGELEHNT: municipalityDesign.colors.status.rejected,
  ERSETZT: municipalityDesign.colors.status.superseded,
};

export const STATUS_LABELS: Record<RecordStatus, string> = {
  NEU: "Neu",
  IN_PRUEFUNG: "In Prüfung",
  FREIGEGEBEN: "Freigegeben",
  ABGELEHNT: "Abgelehnt",
  ERSETZT: "Ersetzt",
};

export interface BuildingRecord {
  id: string;
  buildingId?: string;
  buildingAddress: string;
  longitude?: number;
  latitude?: number;
  receivedDate: string;
  status: RecordStatus;
  assignedTo: string | null;
  assignedAt: Date | null;
  notes: string;
  variantGroup?: string;
  variantLabel?: string;
  rejectedDueToApprovalOf?: string;
  rejectedDueToApprovalOfLabel?: string;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  detInput?: DETInput;
}

export const statusConfig = {
  NEU: {
    label: "Neu",
    icon: ErrorOutlineIcon,
    chipColor: "primary" as const,
    iconColor: "primary.main",
  },
  IN_PRUEFUNG: {
    label: "In Prüfung",
    icon: AccessTimeIcon,
    chipColor: "warning" as const,
    iconColor: "warning.main",
  },
  FREIGEGEBEN: {
    label: "Freigegeben",
    icon: CheckCircleOutlineIcon,
    chipColor: "success" as const,
    iconColor: "success.main",
  },
  ABGELEHNT: {
    label: "Abgelehnt",
    icon: HighlightOffIcon,
    chipColor: "error" as const,
    iconColor: "error.main",
  },
  ERSETZT: {
    label: "Ersetzt",
    icon: PublishedWithChangesIcon,
    chipColor: "default" as const,
    iconColor: "text.secondary",
  },
};
