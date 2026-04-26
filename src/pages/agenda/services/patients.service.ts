// Re-export from global service — searchPatients moved to src/service/patients.ts
export type { Patient } from '@/types/patients'
export { searchPatients, invitePatient } from '@/service/patients.service'
