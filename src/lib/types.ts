export interface Lab {
  id: number;
  auth_user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Patient {
  id: number;
  dni: string;
  first_name: string;
  last_name: string;
  lab_id: number;
  created_at: string;
}

export type ScannerType = "shining" | "medit";

export interface Scan {
  id: number;
  patient_id: number;
  scan_number: number;
  case_number: string | null;
  lab_name: string | null;
  download_date: string | null;
  origin: "csv" | "desktop" | "web" | "migration";
  scanner: ScannerType | null;
  phase: number | null;
  is_phase_start: boolean;
  upper_aligners_count: number | null;
  lower_aligners_count: number | null;
  upper_stage: number;
  lower_stage: number;
  created_at: string;
}

export const PHOTO_KEYS = [
  "face_front",
  "face_left",
  "face_right",
  "smile_front",
  "smile_left",
  "smile_right",
  "xray_front",
  "xray_left",
  "xray_right",
] as const;
export type PhotoKey = (typeof PHOTO_KEYS)[number];

export interface ClinicalForm {
  id: number;
  scan_id: number;
  face_front: string | null;
  face_left: string | null;
  face_right: string | null;
  smile_front: string | null;
  smile_left: string | null;
  smile_right: string | null;
  xray_front: string | null;
  xray_left: string | null;
  xray_right: string | null;
  notes: string | null;
  reason_aesthetics: boolean;
  reason_bite: boolean;
  reason_crowding: boolean;
  reason_spacing: boolean;
  reason_ortho_relapse: boolean;
  diagnosis_class_1: boolean;
  diagnosis_class_2: boolean;
  diagnosis_class_3: boolean;
  diagnosis_crowding_mild: boolean;
  diagnosis_crowding_moderate: boolean;
  diagnosis_crowding_severe: boolean;
  diagnosis_diastemas: boolean;
  diagnosis_open_bite: boolean;
  diagnosis_crossbite: boolean;
  diagnosis_deep_bite: boolean;
  created_at: string;
  updated_at: string;
}

/** Scan with optional clinical form existence flag */
export interface ScanWithForm extends Scan {
  has_clinical_form: boolean;
}

export interface ReprintAligner {
  arch: "upper" | "lower";
  number: number;
}

export interface ReprintRequest {
  id: number;
  scan_id: number;
  aligners: ReprintAligner[];
  status: "pending" | "completed";
  requested_at: string;
  completed_at: string | null;
}
