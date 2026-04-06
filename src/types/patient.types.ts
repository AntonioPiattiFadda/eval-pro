export interface PatientInfo {
  patient_id: string
  user_id: string
  user: {
    full_name: string | null
    email: string | null
    identification_number: string | null
  } | null
}
