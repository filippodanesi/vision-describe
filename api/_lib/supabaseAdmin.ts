/**
 * Supabase Admin client for server-side operations.
 * Uses the service role key to bypass RLS for reading user API keys
 * and writing processing results.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Verify a user's JWT and return the user object.
 */
export async function verifyUserJwt(jwt: string) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(jwt);
  if (error || !user) {
    throw new Error('Invalid or expired JWT');
  }
  return user;
}

/**
 * Fetch user's API keys from user_settings.
 */
export async function getUserApiKeys(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('openai_key, anthropic_key')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Could not fetch user API keys');
  }
  return data as { openai_key: string | null; anthropic_key: string | null };
}
