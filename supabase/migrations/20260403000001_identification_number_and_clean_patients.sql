-- Add identification_number to users (identity data lives here, not on patients)
ALTER TABLE users
  ADD COLUMN identification_number text;

-- Remove personal data columns from patients (they join through users now)
ALTER TABLE patients
  DROP COLUMN full_name,
  DROP COLUMN email;

-- patients always have a linked user account (created at registration)
ALTER TABLE patients
  ALTER COLUMN user_id SET NOT NULL;
