export interface User {
  id: number;
  username: string;
  email?: string;
  full_name: string;
  role: 'admin' | 'lab_incharge' | 'quality_incharge' | 'operator' | 'qc_manager';
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
}

export interface TankRecord {
  id: number;
  date: string;
  tank_number: string;
  batch_number: string;
  milk_quantity: number;
  fat_percentage: number;
  snf_percentage: number;
  temperature: number;
  milk_type: 'cow' | 'buffalo' | 'mixed';
  process_operator_id: number;
  lab_incharge_id?: number;
  tank_release_time?: string;
  packing_machine_detail?: string;
  release_time?: string;
  remarks?: string;
  status: 'draft' | 'pending_lab' | 'pending_admin' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  operator_name?: string;
  lab_incharge_name?: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: number;
  tank_record_id: number;
  approver_id: number;
  approver_role: 'lab_incharge' | 'quality_incharge' | 'qc_manager' | 'admin';
  action: 'approved' | 'rejected';
  comments?: string;
  approved_at: string;
  approver_name?: string;
}

export interface ActivityLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  ip_address?: string;
  user_agent?: string;
  details?: string;
  created_at: string;
  username?: string;
  full_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  entity_type?: string;
  entity_id?: number;
  created_at: string;
}

export interface Statistics {
  total_records: number;
  approved_records: number;
  pending_records: number;
  rejected_records: number;
  total_milk_quantity: number;
  avg_fat: number;
  avg_snf: number;
  avg_temperature: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TankRecordFormData {
  date: string;
  tank_number: string;
  batch_number: string;
  milk_quantity: number;
  fat_percentage: number;
  snf_percentage: number;
  temperature: number;
  milk_type: 'cow' | 'buffalo' | 'mixed';
  tank_release_time?: string;
  packing_machine_detail?: string;
  release_time?: string;
  remarks?: string;
}

export interface FinalProductRecord {
  id: number;
  date: string;
  shift: 'morning' | 'evening' | 'night';
  testing_time?: string;
  tank_no: string;
  type_of_milk: 'cow' | 'buffalo' | 'mixed';
  milk_quantity_l?: number;
  temp_celsius?: number;
  flavour_taste?: string;
  acidity_percent?: number;
  alcohol_result?: string;
  fat_percent?: number;
  clr?: number;
  snf_percent?: number;
  efficiency_percent?: number | null;
  protein_percent?: number;
  electrolyte_condition?: string;
  remark?: string;
  chemist_name?: string;
  quality_incharge_name?: string;
  status?: ApprovalStatus;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  approval_comment?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface FinalProductFormData {
  date: string;
  shift: 'morning' | 'evening' | 'night';
  testing_time?: string;
  tank_no: string;
  type_of_milk: 'cow' | 'buffalo' | 'mixed';
  milk_quantity_l?: number;
  temp_celsius?: number;
  flavour_taste?: string;
  acidity_percent?: number;
  alcohol_result?: string;
  fat_percent?: number;
  clr?: number;
  snf_percent?: number;
  efficiency_percent?: number | null;
  protein_percent?: number;
  electrolyte_condition?: string;
  remark?: string;
  chemist_name?: string;
  quality_incharge_name?: string;
}

export interface BiProductReport {
  id: number;
  batch_no: string;
  date: string;
  product_name: string;
  body_structure?: string;
  sensory?: string;
  taste?: string;
  temp_celsius?: number;
  acidity_percent?: number;
  ph?: number;
  self_life?: string;
  fdm?: number | null;
  fat_percent?: number | null;
  ts?: number | null;
  lassi_viscosity?: number | null;
  moisture?: number | null;
  chemist_name?: string;
  quality_incharge_name?: string;
  status?: ApprovalStatus;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  approval_comment?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BiProductFormData {
  batch_no: string;
  date: string;
  product_name: string;
  body_structure?: string;
  sensory?: string;
  taste?: string;
  temp_celsius?: number;
  acidity_percent?: number;
  ph?: number;
  self_life?: string;
  fdm?: number | null;
  fat_percent?: number | null;
  ts?: number | null;
  lassi_viscosity?: number | null;
  moisture?: number | null;
  chemist_name?: string;
  quality_incharge_name?: string;
}

export interface RawBulkMilkRecord {
  id: number;
  date: string;
  testing_time?: string;
  sample_name: string;
  type_of_milk: string;
  milk_quantity_lit?: number;
  temp_celsius?: number;
  ot?: number;
  acidity_percent?: number;
  alcohol_result?: string;
  fat_percent?: number;
  clr?: number;
  snf?: number;
  protein_percent?: number | null;
  sodium_electrolyte_condition?: string | null;
  ph?: number;
  chemist_name?: string;
  quality_incharge_name?: string;
  status?: ApprovalStatus;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  approval_comment?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface RawBulkMilkFormData {
  date: string;
  testing_time?: string;
  sample_name: string;
  type_of_milk: string;
  milk_quantity_lit?: number;
  temp_celsius?: number;
  ot?: number;
  acidity_percent?: number;
  alcohol_result?: string;
  fat_percent?: number;
  clr?: number;
  snf?: number;
  protein_percent?: number | null;
  sodium_electrolyte_condition?: string | null;
  ph?: number;
  chemist_name?: string;
  quality_incharge_name?: string;
}

// ─── Packing Milk Report ──────────────────────────────────────────────────────

export interface PackingMilkReport {
  id: number;
  date: string;
  testing_time?: string;
  tank_no: string;
  batch_no: string;
  packing_head: string;
  product_name: string;
  temp_celsius?: number;
  acidity_percent?: number;
  alcohol_result?: string;
  fat_percent?: number;
  clr?: number;
  snf_percent?: number;
  phosphatase_test?: string;
  br?: number | null;
  ph?: number | null;
  ts?: number;
  protein_percent?: number;
  remark?: string;
  chemist_name?: string;
  quality_incharge_name?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PackingMilkFormData {
  date: string;
  testing_time?: string;
  tank_no: string;
  batch_no: string;
  packing_head: string;
  product_name: string;
  temp_celsius?: number;
  acidity_percent?: number;
  alcohol_result?: string;
  fat_percent?: number;
  clr?: number;
  snf_percent?: number;
  phosphatase_test?: string;
  br?: number | null;
  ph?: number | null;
  ts?: number;
  protein_percent?: number;
  remark?: string;
  chemist_name?: string;
  quality_incharge_name?: string;
}

// ─── Milk Taken Report (Bi-Product) ──────────────────────────────────────────

export interface MilkTakenReportBiProduct {
  id: number;
  date: string;
  product_name: string;
  testing_time?: string;
  temp_celsius?: number;
  ot?: number;
  acidity_percent?: number;
  alcohol_result?: string;
  fat_percent?: number;
  clr?: number;
  snf_percent?: number;
  neutralizer_adultration?: string;
  sodium_electrolyte_condition?: string | null;
  ph?: number | null;
  chemist_name?: string;
  qc_manager_name?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface MilkTakenReportBiProductFormData {
  date: string;
  product_name: string;
  testing_time?: string;
  temp_celsius?: number;
  ot?: number;
  acidity_percent?: number;
  alcohol_result?: string;
  fat_percent?: number;
  clr?: number;
  snf_percent?: number;
  neutralizer_adultration?: string;
  sodium_electrolyte_condition?: string | null;
  ph?: number | null;
  chemist_name?: string;
  qc_manager_name?: string;
}

// ─── Butter Milk Analysis Records ─────────────────────────────────────────────

export interface ButtermilkAnalysisRecord {
  id: number;
  date: string;
  shift: string;
  type_of_sample: string;
  testing_time: string;
  batch_no: string;
  packing_date: string;
  expiry_date: string;
  flavour: string;
  taste: string;
  fat_percent: string;
  degree: string;
  acidity_percent: string;
  protein_percent: string;
  adulteration: string;
  remark: string;
  sign_name: string;
  chemist_name: string;
  quality_incharge_name: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
}

export interface ButtermilkAnalysisFormData {
  date: string;
  shift: string;
  type_of_sample: string;
  testing_time: string;
  batch_no: string;
  packing_date: string;
  expiry_date: string;
  flavour: string;
  taste: string;
  fat_percent: string;
  degree: string;
  acidity_percent: string;
  protein_percent: string;
  adulteration: string;
  remark: string;
  sign_name: string;
  chemist_name: string;
  quality_incharge_name: string;
}
