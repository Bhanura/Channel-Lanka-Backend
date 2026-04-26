-- ============================================================
-- Channel Lanka — Full Database Schema Migration
-- Run this in your Supabase SQL Editor (in order)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'center_admin', 'platform_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('booked', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('pending', 'present', 'absent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE request_initiator AS ENUM ('doctor', 'center');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users (mirrors auth.users, holds role)
CREATE TABLE IF NOT EXISTS public.users (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     TEXT NOT NULL UNIQUE,
  role      user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients
CREATE TABLE IF NOT EXISTS public.patients (
  patient_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  dob         DATE,
  gender      TEXT,
  nic         TEXT,
  location    TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors
CREATE TABLE IF NOT EXISTS public.doctors (
  doctor_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  specialization      TEXT,
  license_number      TEXT,
  nic                 TEXT,
  phone               TEXT,
  bio                 TEXT,
  avatar_url          TEXT,
  verification_status verification_status DEFAULT 'pending',
  verified_by         UUID REFERENCES public.users(user_id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor Qualifications
CREATE TABLE IF NOT EXISTS public.doctor_qualifications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id      UUID NOT NULL REFERENCES public.doctors(doctor_id) ON DELETE CASCADE,
  qualification  TEXT NOT NULL,
  institute      TEXT,
  year           INT
);

-- Doctor Ratings
CREATE TABLE IF NOT EXISTS public.doctor_ratings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES public.doctors(doctor_id) ON DELETE CASCADE,
  rate_value  INT NOT NULL CHECK (rate_value BETWEEN 1 AND 5),
  review      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, doctor_id)
);

-- Channeling Centers
CREATE TABLE IF NOT EXISTS public.channeling_centers (
  center_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  location            TEXT,
  phone               TEXT,
  email               TEXT,
  description         TEXT,
  logo_url            TEXT,
  verification_status verification_status DEFAULT 'pending',
  verified_by         UUID REFERENCES public.users(user_id),
  created_by          UUID REFERENCES public.users(user_id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Center Ratings
CREATE TABLE IF NOT EXISTS public.center_ratings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  center_id   UUID NOT NULL REFERENCES public.channeling_centers(center_id) ON DELETE CASCADE,
  rate_value  INT NOT NULL CHECK (rate_value BETWEEN 1 AND 5),
  review      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, center_id)
);

-- Center Admins (creator + added staff)
CREATE TABLE IF NOT EXISTS public.center_admins (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id    UUID NOT NULL REFERENCES public.channeling_centers(center_id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  center_role  TEXT NOT NULL DEFAULT 'staff',  -- 'owner', 'manager', 'receptionist', 'staff'
  added_by     UUID REFERENCES public.users(user_id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(center_id, user_id)
);

-- Facilities
CREATE TABLE IF NOT EXISTS public.facilities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT
);

-- Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  room_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id  UUID NOT NULL REFERENCES public.channeling_centers(center_id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  charge     DECIMAL(10,2) DEFAULT 0
);

-- Center Facilities (many-to-many)
CREATE TABLE IF NOT EXISTS public.center_facilities (
  center_id   UUID REFERENCES public.channeling_centers(center_id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  PRIMARY KEY (center_id, facility_id)
);

-- Room Facilities (many-to-many)
CREATE TABLE IF NOT EXISTS public.room_facilities (
  room_id     UUID REFERENCES public.rooms(room_id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, facility_id)
);

-- Channel Sessions
CREATE TABLE IF NOT EXISTS public.channel_sessions (
  session_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id                UUID NOT NULL REFERENCES public.doctors(doctor_id),
  room_id                  UUID NOT NULL REFERENCES public.rooms(room_id),
  created_by               UUID REFERENCES public.center_admins(id),
  date                     DATE NOT NULL,
  start_time               TIME NOT NULL,
  end_time                 TIME NOT NULL,
  patient_limit            INT NOT NULL DEFAULT 20,
  doctor_fee               DECIMAL(10,2) DEFAULT 0,
  status                   session_status DEFAULT 'scheduled',
  doctor_attendance_status attendance_status DEFAULT 'pending',
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (defined before appointments due to FK)
CREATE TABLE IF NOT EXISTS public.payments (
  payment_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID,  -- FK added after appointments table
  doctor_fee      DECIMAL(10,2),
  center_fee      DECIMAL(10,2),
  platform_fee    DECIMAL(10,2),
  tax             DECIMAL(10,2),
  total_amount    DECIMAL(10,2),
  payment_method  TEXT,
  payment_status  payment_status DEFAULT 'pending',
  transaction_ref TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  appointment_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id          UUID NOT NULL REFERENCES public.channel_sessions(session_id),
  patient_id          UUID REFERENCES public.patients(patient_id),  -- NULL for guests
  payment_id          UUID REFERENCES public.payments(payment_id),
  appointment_number  INT NOT NULL,
  status              appointment_status DEFAULT 'booked',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from payments to appointments (circular, add after both tables exist)
DO $$ BEGIN
  ALTER TABLE public.payments
    ADD CONSTRAINT fk_payments_appointment
    FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Doctor Requests (bidirectional: doctor→center OR center→doctor)
CREATE TABLE IF NOT EXISTS public.doctor_requests (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiated_by_role          request_initiator NOT NULL,
  requesting_doctor_id       UUID REFERENCES public.doctors(doctor_id),
  requesting_center_admin_id UUID REFERENCES public.center_admins(id),
  doctor_id                  UUID NOT NULL REFERENCES public.doctors(doctor_id),
  center_id                  UUID NOT NULL REFERENCES public.channeling_centers(center_id),
  offer_details              TEXT,
  request_status             request_status DEFAULT 'pending',
  created_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Registered Doctors (approved doctor↔center links)
CREATE TABLE IF NOT EXISTS public.registered_doctors (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id  UUID NOT NULL REFERENCES public.doctors(doctor_id) ON DELETE CASCADE,
  center_id  UUID NOT NULL REFERENCES public.channeling_centers(center_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, center_id)
);

-- Messages (doctor ↔ center thread)
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES public.users(user_id),
  receiver_id UUID NOT NULL REFERENCES public.users(user_id),
  center_id   UUID NOT NULL REFERENCES public.channeling_centers(center_id),
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT,
  type        TEXT DEFAULT 'general',
  related_id  UUID,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Config (admin-managed fee rules)
CREATE TABLE IF NOT EXISTS public.payment_config (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_fee_pct DECIMAL(5,2) NOT NULL DEFAULT 5.0,
  tax_pct          DECIMAL(5,2) NOT NULL DEFAULT 2.5,
  updated_by       UUID REFERENCES public.users(user_id),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- System Logs
CREATE TABLE IF NOT EXISTS public.system_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action          TEXT NOT NULL,
  description     TEXT,
  performed_by    UUID REFERENCES public.users(user_id),
  affecting_user  UUID REFERENCES public.users(user_id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_session ON public.appointments(session_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_doctor ON public.channel_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.channel_sessions(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_center ON public.messages(center_id);
CREATE INDEX IF NOT EXISTS idx_doctors_verification ON public.doctors(verification_status);
CREATE INDEX IF NOT EXISTS idx_centers_verification ON public.channeling_centers(verification_status);

-- ============================================================
-- DEFAULT PAYMENT CONFIG
-- ============================================================
INSERT INTO public.payment_config (platform_fee_pct, tax_pct)
VALUES (5.0, 2.5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DEFAULT FACILITIES
-- ============================================================
INSERT INTO public.facilities (name, description) VALUES
  ('Air Conditioning', 'Fully air-conditioned premises'),
  ('Parking', 'Free parking available'),
  ('Pharmacy', 'In-house pharmacy'),
  ('Lab Services', 'Diagnostic laboratory'),
  ('Wheelchair Access', 'Wheelchair accessible facilities'),
  ('WiFi', 'Free WiFi for patients'),
  ('Canteen', 'On-site canteen/cafeteria')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channeling_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- NOTE: The backend uses the service_role key which bypasses RLS.
-- These policies are defense-in-depth for direct DB access.

-- Users: can read own row
CREATE POLICY "users_own" ON public.users FOR SELECT USING (auth.uid() = user_id);

-- Patients: own data only
CREATE POLICY "patients_own" ON public.patients FOR ALL USING (
  user_id = auth.uid()
);

-- Doctors: own data + public read for approved
CREATE POLICY "doctors_read_approved" ON public.doctors FOR SELECT USING (
  verification_status = 'approved' OR user_id = auth.uid()
);
CREATE POLICY "doctors_update_own" ON public.doctors FOR UPDATE USING (user_id = auth.uid());

-- Doctor qualifications: public read
CREATE POLICY "qualifications_read" ON public.doctor_qualifications FOR SELECT USING (true);

-- Doctor ratings: public read
CREATE POLICY "ratings_read" ON public.doctor_ratings FOR SELECT USING (true);

-- Centers: public read for approved
CREATE POLICY "centers_read_approved" ON public.channeling_centers FOR SELECT USING (
  verification_status = 'approved' OR created_by = auth.uid()
);

-- Center ratings: public read
CREATE POLICY "center_ratings_read" ON public.center_ratings FOR SELECT USING (true);

-- Facilities: public read
CREATE POLICY "facilities_read" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "center_facilities_read" ON public.center_facilities FOR SELECT USING (true);
CREATE POLICY "room_facilities_read" ON public.room_facilities FOR SELECT USING (true);

-- Rooms: public read (for sessions/booking)
CREATE POLICY "rooms_read" ON public.rooms FOR SELECT USING (true);

-- Sessions: public read for scheduled
CREATE POLICY "sessions_read_scheduled" ON public.channel_sessions FOR SELECT USING (
  status = 'scheduled' OR status = 'active'
);

-- Notifications: own only
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- Messages: involved parties only
CREATE POLICY "messages_own" ON public.messages FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);

-- Payment config: public read (for fee display)
CREATE POLICY "payment_config_read" ON public.payment_config FOR SELECT USING (true);

-- Appointments: own + center admins for their sessions
CREATE POLICY "appointments_read_own" ON public.appointments FOR SELECT USING (
  patient_id IN (SELECT patient_id FROM public.patients WHERE user_id = auth.uid())
);

-- Payments: own only
CREATE POLICY "payments_own" ON public.payments FOR SELECT USING (
  appointment_id IN (
    SELECT appointment_id FROM public.appointments
    WHERE patient_id IN (SELECT patient_id FROM public.patients WHERE user_id = auth.uid())
  )
);
