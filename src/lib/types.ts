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

export interface Scan {
  id: number;
  patient_id: number;
  scan_number: number;
  case_number: string | null;
  lab_name: string | null;
  download_date: string | null;
  origin: "csv" | "desktop" | "web";
  upper_aligners_count: number | null;
  lower_aligners_count: number | null;
  upper_stage: number;
  lower_stage: number;
  created_at: string;
}

export interface ClinicalForm {
  id: number;
  scan_id: number;
  photo_profile: string | null;
  photo_front: string | null;
  xray_image: string | null;
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
