import { supabase } from '.'
import { checkUserExists, insertProfile } from './profiles'
import type { UserRole } from '@/types/users.types'

export const signIn = async (email: string, password: string) => {
  console.log('[auth] signIn →', email)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error('[auth] signIn error:', error.message)
    throw new Error(error.message)
  }
  console.log('[auth] signIn ok — user id:', data.user?.id)
  return data
}

export const signOut = async (): Promise<void> => {
  console.log('[auth] signOut')
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export const signUp = async (email: string, password: string, role: UserRole) => {
  console.log('[auth] signUp →', email, 'role:', role)

  const { userExists } = await checkUserExists(email)
  if (userExists) {
    console.warn('[auth] signUp — email already in use:', email)
    const error = new Error('El email ya está en uso.')
    error.name = 'ConflictError'
    throw error
  }

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    console.error('[auth] signUp auth error:', error.message)
    throw new Error(error.message)
  }
  if (!data.user) throw new Error('Error desconocido al crear el usuario.')

  console.log('[auth] signUp auth user created — id:', data.user.id)

  const { error: profileError } = await insertProfile(data.user.id, email, role)
  if (profileError) {
    console.error('[auth] signUp insertProfile error:', profileError.message)
    throw profileError
  }

  console.log('[auth] signUp complete — profile + role inserted')
  return data
}
