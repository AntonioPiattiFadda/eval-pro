import { supabase } from '.'
import { getUserId } from '.'
import type { UserRole, User } from '@/types/users.types'

export type { UserRole, User }

export const checkUserExists = async (email: string) => {
  const { data } = await supabase
    .from('users')
    .select('user_id')
    .eq('email', email)
    .single()
  return { userExists: data !== null }
}

export const getUserDataByUid = async () => {
  const uid = await getUserId()
  const { data, error } = await supabase
    .from('users')
    .select('*, user_roles(role)')
    .eq('user_id', uid)
    .single()
  if (error) throw new Error(error.message)
  return { data, error }
}

export const insertProfile = async (userId: string, email: string, role: UserRole): Promise<{ error: Error | null }> => {
  console.log('[profiles] insertProfile — userId:', userId, 'email:', email, 'role:', role)

  const { error: userError } = await supabase
    .from('users')
    .insert({ user_id: userId, email })

  if (userError) {
    console.error('[profiles] insertProfile — users insert error:', userError.message)
    return { error: new Error(userError.message) }
  }
  console.log('[profiles] insertProfile — users row inserted')

  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role })

  if (roleError) {
    console.error('[profiles] insertProfile — user_roles insert error:', roleError.message)
    return { error: new Error(roleError.message) }
  }
  console.log('[profiles] insertProfile — user_roles row inserted')

  return { error: null }
}

export const getUserProfile = async (userId: string): Promise<User | null> => {
  console.log('[profiles] getUserProfile — userId:', userId)

  const { data, error } = await supabase
    .from('users')
    .select('user_id, email, full_name, organization_id, created_at, user_roles(role)')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('[profiles] getUserProfile error:', error.message)
    return null
  }
  if (!data) {
    console.warn('[profiles] getUserProfile — no data for userId:', userId)
    return null
  }

  const roles = (data.user_roles as { role: UserRole }[]).map(r => r.role)
  console.log('[profiles] getUserProfile — roles:', roles)

  return {
    user_id: data.user_id,
    email: data.email,
    full_name: data.full_name,
    organization_id: data.organization_id,
    created_at: data.created_at,
    roles,
  }
}
