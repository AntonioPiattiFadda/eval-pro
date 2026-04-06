export interface Patient {
  patient_id: string
  user_id: string
  organization_id: string
  created_at: string
  user: {
    full_name: string | null
    email: string | null
    identification_number: string | null
  }
}
