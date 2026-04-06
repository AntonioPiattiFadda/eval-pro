import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;

// const storageUrl =
//   "https://khpuigptjufryfxcnsrs.supabase.co/storage/v1/object/public/";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Anon Key in environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getUserId = async (): Promise<string | undefined> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id
}
