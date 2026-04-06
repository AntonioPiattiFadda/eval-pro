import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, full_name, identification_number, organization_id, redirectTo } =
      await req.json() as {
        email: string
        full_name: string
        identification_number?: string
        organization_id: string
        redirectTo?: string
      }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const normalizedEmail = email.toLowerCase().trim()

    // 1. Check if user already exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    let userId: string

    if (existingUser) {
      userId = existingUser.user_id
    } else {
      // Invite new user — Supabase sends the activation email
      const { data: invited, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
          redirectTo: redirectTo ?? undefined,
        })
      if (inviteError) throw inviteError
      userId = invited.user.id

      // Create public.users record with all personal data (single source of truth)
      const { error: userInsertError } = await supabaseAdmin
        .from('users')
        .insert({
          user_id: userId,
          email: normalizedEmail,
          full_name,
          identification_number: identification_number ?? null,
          organization_id,
        })
      if (userInsertError) throw userInsertError
    }

    // Ensure PATIENT role exists for this org (user may already exist as professional)
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('user_id', userId)
      .eq('role', 'PATIENT')
      .eq('organization_id', organization_id)
      .maybeSingle()

    if (!existingRole) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'PATIENT', organization_id })
      if (roleError) throw roleError
    }

    // 2. Check if patient already exists in this org (avoid duplicates)
    const { data: existingPatient } = await supabaseAdmin
      .from('patients')
      .select(`
        patient_id, user_id, organization_id, created_at,
        user:users!patients_user_id_fkey (full_name, email, identification_number)
      `)
      .eq('user_id', userId)
      .eq('organization_id', organization_id)
      .maybeSingle()

    if (existingPatient) {
      return new Response(JSON.stringify(existingPatient), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Create patient row
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert({ user_id: userId, organization_id })
      .select(`
        patient_id, user_id, organization_id, created_at,
        user:users!patients_user_id_fkey (full_name, email, identification_number)
      `)
      .single()
    if (patientError) throw patientError

    return new Response(JSON.stringify(patient), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
