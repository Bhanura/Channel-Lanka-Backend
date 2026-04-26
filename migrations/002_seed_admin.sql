-- ============================================================
-- Channel Lanka — Seed Platform Admin
-- Run AFTER 001_init_schema.sql
-- This seeds the default platform admin: admin@admin.com / password
-- ============================================================

-- Step 1: Create the auth user using Supabase's internal function
-- NOTE: In Supabase, you CANNOT directly insert into auth.users via SQL.
-- Instead, use the Supabase Dashboard > Authentication > Users > Add User
-- OR use the Management API / seed script below via a Node.js script.
--
-- Supabase Dashboard method (easiest):
--   1. Go to Authentication > Users > Invite User
--   2. Email: admin@admin.com
--   3. Then run Step 2 below to update the role.
--
-- After creating the auth user, find the UUID from the dashboard and run:

-- Step 2: Insert into users table (replace <ADMIN_UUID> with the actual UUID)
-- INSERT INTO public.users (user_id, email, role)
-- VALUES ('<ADMIN_UUID>', 'admin@admin.com', 'platform_admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'platform_admin';

-- ============================================================
-- AUTOMATED SEED (via backend seed script — see scripts/seedAdmin.js)
-- ============================================================
-- This file documents the manual SQL. The automated version is:
--   cd backend && node scripts/seedAdmin.js
-- ============================================================
