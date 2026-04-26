/**
 * src/config/supabase.js
 * Initializes two Supabase clients:
 *   - `supabase`  : Uses the anon key (respects RLS). Used for read operations.
 *   - `supabaseAdmin` : Uses the service_role key (bypasses RLS). Used for admin writes,
 *                       user creation, and seeding. NEVER expose this to the frontend.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables. Check your .env file.');
  process.exit(1);
}

/** Standard client — respects Row Level Security */
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Admin client — bypasses RLS. Use only in backend service layer. */
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabase, supabaseAdmin };
