export type SessionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'

export interface Session {
  session_id: string
  patient_id: string
  professional_id: string
  region_id: string | null
  domain_id: string | null
  objective_id: string | null
  organization_id: string
  status: SessionStatus
  created_at: string
}

export interface SessionHistoryItem {
  session_id: string
  created_at: string
  status: SessionStatus
  domain: { name: string } | null
  region: { name: string } | null
}
