import { supabase } from '@/service'
import type { Location, CreateLocationInput } from '../types/location.types'

export async function getUserOrg(userId: string): Promise<{ organization_id: string; organization_name: string } | null> {
  const { data, error } = await supabase
    .from('users')
    .select('organization_id, organizations(organization_name)')
    .eq('user_id', userId)
    .single()

  if (error || !data?.organization_id) return null

  const org = data.organizations as unknown as { organization_name: string } | null
  const orgName = org?.organization_name ?? 'Mi Organización'

  return {
    organization_id: data.organization_id as string,
    organization_name: orgName,
  }
}

export async function getLocationsForOrg(orgId: string): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', orgId)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function createLocation(input: CreateLocationInput): Promise<Location> {
  const { data, error } = await supabase
    .from('locations')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLocation(locationId: string): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('location_id', locationId)

  if (error) throw error
}
