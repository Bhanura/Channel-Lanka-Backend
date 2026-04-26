/**
 * scripts/seedAdmin.js
 * Seeds the default platform admin account using the Supabase Admin SDK.
 * Run ONCE after setting up your Supabase project:
 *   node scripts/seedAdmin.js
 */
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seedAdmin() {
  console.log('🌱 Seeding platform admin...');

  const email = 'admin@admin.com';
  const password = 'password';

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'platform_admin' },
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('ℹ️  Admin user already exists. Skipping auth creation.');
      // Try to find existing user
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existing = users?.users?.find(u => u.email === email);
      if (existing) {
        await ensureUsersRecord(existing.id, email);
      }
    } else {
      console.error('❌ Failed to create auth user:', authError.message);
      process.exit(1);
    }
    return;
  }

  const userId = authData.user.id;
  await ensureUsersRecord(userId, email);

  console.log(`✅ Platform admin seeded successfully!`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   User ID:  ${userId}`);
}

async function ensureUsersRecord(userId, email) {
  const { error } = await supabaseAdmin
    .from('users')
    .upsert({ user_id: userId, email, role: 'platform_admin' }, { onConflict: 'user_id' });

  if (error) {
    console.error('❌ Failed to insert into users table:', error.message);
    process.exit(1);
  }
  console.log('✅ users table record ensured.');
}

seedAdmin().catch(console.error);
