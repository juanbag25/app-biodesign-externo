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
  case_number: string;
  lab_name: string;
  download_date: string;
  upper_aligners_count: number | null;
  lower_aligners_count: number | null;
  upper_stage: number;
  lower_stage: number;
  created_at: string;
}
