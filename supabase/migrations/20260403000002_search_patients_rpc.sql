CREATE OR REPLACE FUNCTION search_patients(p_org_id uuid, p_query text)
RETURNS TABLE (
  patient_id uuid,
  user_id     uuid,
  organization_id uuid,
  created_at  timestamptz,
  full_name   text,
  email       text,
  identification_number text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.patient_id,
    p.user_id,
    p.organization_id,
    p.created_at,
    u.full_name,
    u.email,
    u.identification_number
  FROM patients p
  JOIN users u ON u.user_id = p.user_id
  WHERE p.organization_id = p_org_id
    AND (
      u.full_name            ILIKE '%' || p_query || '%'
      OR u.email             ILIKE '%' || p_query || '%'
      OR u.identification_number ILIKE '%' || p_query || '%'
    )
  ORDER BY u.full_name
  LIMIT 10;
$$;
