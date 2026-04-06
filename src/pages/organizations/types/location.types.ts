export type LocationType = 'GYM' | 'REHAB_CENTER' | 'CLINIC'

export interface Location {
  location_id: string
  name: string
  type: LocationType
  organization_id: string | null
  created_at: string
}

export interface CreateLocationInput {
  name: string
  type: LocationType
  organization_id: string
}

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  GYM: 'Gimnasio',
  REHAB_CENTER: 'Centro de Rehabilitación',
  CLINIC: 'Consultorio',
}

export const LOCATION_TYPE_COLORS: Record<LocationType, string> = {
  GYM: '#FF5722',
  REHAB_CENTER: '#22c55e',
  CLINIC: '#60a5fa',
}
