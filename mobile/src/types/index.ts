export interface User {
  user_id: number;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'patient';
}

export interface PatientProfile {
  patient_id: number;
  user_id: number;
  name: string;
  dob: string;
  gender: string;
  blood_group: string;
  phone: string;
  email: string;
  address: string;
  emergency_contact: string;
}

export interface Department {
  department_id: number;
  department_name: string;
  description: string;
}

export interface Doctor {
  doctor_id: number;
  user_id: number;
  department_id: number;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  experience: number;
  consultation_fee: number;
  department_name?: string;
  is_active?: number;
}

export interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  diagnosis?: string | null;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  created_at?: string;
  patient_name?: string;
  patient_phone?: string;
  doctor_name?: string;
  doctor_specialization?: string;
  consultation_fee?: number;
  department_name?: string;
  department_id?: number;
  bill_id?: number;
  bill_amount?: number;
  bill_status?: string;
  payment_id?: number;
  payment_status?: PaymentStatus;
  transaction_ref?: string;
}

export type PaymentStatus =
  | 'Awaiting Payment'
  | 'Pending Verification'
  | 'Paid'
  | 'Rejected'
  | 'Cancelled';

export interface Bill {
  bill_id: number;
  patient_id: number;
  appointment_id?: number | null;
  admission_id?: number | null;
  amount: number;
  bill_date: string;
  description: string;
  status: 'Pending' | 'Paid';
  patient_name?: string;
  payment_id?: number;
  payment_status?: PaymentStatus;
  transaction_ref?: string;
  rejection_reason?: string;
  submitted_at?: string;
  verified_at?: string;
}

export interface Payment {
  payment_id: number;
  bill_id: number;
  appointment_id?: number | null;
  patient_id: number;
  payment_method: string;
  transaction_ref?: string | null;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  submitted_at?: string | null;
  verified_at?: string | null;
  verified_by?: number | null;
  rejection_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  bill_description?: string;
  bill_status?: string;
  appointment_date?: string;
  appointment_time?: string;
  doctor_name?: string;
  doctor_specialization?: string;
  department_name?: string;
  verified_by_name?: string;
}

export interface VerifiedReceipt {
  hospital_name: string;
  hospital_address: string;
  hospital_contact: string;
  receipt_number: string;
  payment_id: number;
  bill_id: number;
  appointment_id?: number | null;
  patient: {
    patient_id: number;
    name: string;
    phone: string;
    email: string;
  };
  doctor?: {
    name: string;
    specialization: string;
    department: string;
  } | null;
  appointment?: {
    date: string;
    time: string;
    reason: string;
  } | null;
  financials: {
    amount: number;
    currency: string;
    description: string;
    payment_method: string;
    bank_channel: string;
    transaction_ref: string;
    payment_status: PaymentStatus;
  };
  audit: {
    submitted_at?: string;
    verified_at?: string;
    verified_by?: string;
  };
  issued_at: string;
}

export interface PatientDashboardData {
  patient: PatientProfile;
  upcomingAppointment?: Appointment | null;
  lastVisit?: Appointment | null;
  pendingBills: number;
  pendingVerifications: number;
  awaitingPayments: number;
  recentPayments: Payment[];
  recentPrescriptions: any[];
}
