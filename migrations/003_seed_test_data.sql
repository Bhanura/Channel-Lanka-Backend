-- ============================================================
-- Channel Lanka — Test Seed Data
-- Run in Supabase SQL Editor AFTER 001_init_schema.sql
-- ============================================================
-- IMPORTANT: Supabase does not allow direct INSERT into auth.users via SQL Editor
-- by default. We use a DO block to insert via internal schema.
-- If this fails, create users manually in Dashboard > Authentication > Users
-- then skip the auth.users block and run the rest.
-- ============================================================

-- Fixed UUIDs for consistency
-- platform_admin : a0000000-0000-0000-0000-000000000001
-- center_admin1  : a0000000-0000-0000-0000-000000000002
-- center_admin2  : a0000000-0000-0000-0000-000000000003
-- doctor1        : a0000000-0000-0000-0000-000000000004
-- doctor2        : a0000000-0000-0000-0000-000000000005
-- doctor3        : a0000000-0000-0000-0000-000000000006
-- patient1       : a0000000-0000-0000-0000-000000000007
-- patient2       : a0000000-0000-0000-0000-000000000008
-- patient3       : a0000000-0000-0000-0000-000000000009

-- ============================================================
-- STEP 1: Auth Users (run as service_role in SQL Editor)
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES
  ('a0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'admin@channellanka.lk', crypt('Admin@1234', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('a0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'cadmin1@channellanka.lk', crypt('Admin@1234', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('a0000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'cadmin2@channellanka.lk', crypt('Admin@1234', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('a0000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'dr.perera@channellanka.lk', crypt('Doctor@1234', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('a0000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'dr.silva@channellanka.lk', crypt('Doctor@1234', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('a0000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'dr.fernando@channellanka.lk', crypt('Doctor@1234', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('a0000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'patient1@gmail.com', crypt('Patient@1234', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('a0000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'patient2@gmail.com', crypt('Patient@1234', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('a0000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'patient3@gmail.com', crypt('Patient@1234', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 2: public.users
-- ============================================================
INSERT INTO public.users (user_id, email, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@channellanka.lk',    'platform_admin'),
  ('a0000000-0000-0000-0000-000000000002', 'cadmin1@channellanka.lk',  'center_admin'),
  ('a0000000-0000-0000-0000-000000000003', 'cadmin2@channellanka.lk',  'center_admin'),
  ('a0000000-0000-0000-0000-000000000004', 'dr.perera@channellanka.lk','doctor'),
  ('a0000000-0000-0000-0000-000000000005', 'dr.silva@channellanka.lk', 'doctor'),
  ('a0000000-0000-0000-0000-000000000006', 'dr.fernando@channellanka.lk','doctor'),
  ('a0000000-0000-0000-0000-000000000007', 'patient1@gmail.com',       'patient'),
  ('a0000000-0000-0000-0000-000000000008', 'patient2@gmail.com',       'patient'),
  ('a0000000-0000-0000-0000-000000000009', 'patient3@gmail.com',       'patient')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- STEP 3: Patients
-- ============================================================
INSERT INTO public.patients (patient_id, user_id, name, dob, gender, nic, location, phone) VALUES
  ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000007',
   'Nimal Kumara',  '1990-05-14','Male',  '901234567V','Colombo','0711234567'),
  ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000008',
   'Sanduni Perera','1995-08-22','Female','952345678V','Kandy',  '0722345678'),
  ('b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000009',
   'Kasun Fernando', '1988-12-01','Male',  '883456789V','Galle',  '0733456789')
ON CONFLICT (patient_id) DO NOTHING;

-- ============================================================
-- STEP 4: Doctors
-- ============================================================
INSERT INTO public.doctors (doctor_id, user_id, name, specialization, license_number, nic, phone, bio, verification_status, verified_by) VALUES
  ('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004',
   'Dr. Chaminda Perera','Cardiology','SLMC-2345','750123456V','0711111111',
   'Senior cardiologist with 15+ years experience at National Hospital.',
   'approved','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000005',
   'Dr. Amali Silva','Pediatrics','SLMC-5678','820234567V','0722222222',
   'Specialist in child health and development, MBBS, MD (Pediatrics).',
   'approved','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000006',
   'Dr. Rohan Fernando','Orthopedics','SLMC-9101','780345678V','0733333333',
   'Orthopedic surgeon specializing in joint replacement and sports injuries.',
   'pending', NULL)
ON CONFLICT (doctor_id) DO NOTHING;

-- ============================================================
-- STEP 5: Doctor Qualifications
-- ============================================================
INSERT INTO public.doctor_qualifications (doctor_id, qualification, institute, year) VALUES
  ('c0000000-0000-0000-0000-000000000001','MBBS','University of Colombo',2000),
  ('c0000000-0000-0000-0000-000000000001','MD (Cardiology)','Postgraduate Institute of Medicine',2005),
  ('c0000000-0000-0000-0000-000000000001','FRCP','Royal College of Physicians, UK',2010),
  ('c0000000-0000-0000-0000-000000000002','MBBS','University of Kelaniya',2005),
  ('c0000000-0000-0000-0000-000000000002','MD (Pediatrics)','Postgraduate Institute of Medicine',2010),
  ('c0000000-0000-0000-0000-000000000003','MBBS','University of Sri Jayewardenepura',2002),
  ('c0000000-0000-0000-0000-000000000003','MS (Orthopedics)','Postgraduate Institute of Medicine',2008);

-- ============================================================
-- STEP 6: Channeling Centers
-- ============================================================
INSERT INTO public.channeling_centers (center_id, name, location, phone, email, description, verification_status, verified_by, created_by) VALUES
  ('d0000000-0000-0000-0000-000000000001',
   'Asiri Medical Centre','Colombo 05','0112345678','info@asiri.lk',
   'Leading private hospital in Colombo with 24/7 specialist care.',
   'approved','a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000002',
   'Kandy Channeling Centre','Kandy','0812234567','info@kandycc.lk',
   'Premier channeling centre serving central province patients.',
   'approved','a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003')
ON CONFLICT (center_id) DO NOTHING;

-- ============================================================
-- STEP 7: Center Admins
-- ============================================================
INSERT INTO public.center_admins (id, center_id, user_id, center_role) VALUES
  ('e0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','owner'),
  ('e0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003','owner')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 8: Center Facilities
-- ============================================================
-- Link facilities (seeded in 001) to centers
-- Facility IDs are auto-generated; use sub-select
INSERT INTO public.center_facilities (center_id, facility_id)
SELECT 'd0000000-0000-0000-0000-000000000001', id FROM public.facilities
WHERE name IN ('Air Conditioning','Parking','Pharmacy','Lab Services','WiFi')
ON CONFLICT DO NOTHING;

INSERT INTO public.center_facilities (center_id, facility_id)
SELECT 'd0000000-0000-0000-0000-000000000002', id FROM public.facilities
WHERE name IN ('Air Conditioning','Parking','Pharmacy','Wheelchair Access')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 9: Rooms
-- ============================================================
INSERT INTO public.rooms (room_id, center_id, name, charge) VALUES
  ('f0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','Consultation Room 1',500.00),
  ('f0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000001','Consultation Room 2',500.00),
  ('f0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000002','Consultation Room A',400.00),
  ('f0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000002','Consultation Room B',400.00)
ON CONFLICT (room_id) DO NOTHING;

-- ============================================================
-- STEP 10: Registered Doctors (approved doctor-center links)
-- ============================================================
INSERT INTO public.registered_doctors (doctor_id, center_id) VALUES
  ('c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002')
ON CONFLICT (doctor_id, center_id) DO NOTHING;

-- ============================================================
-- STEP 11: Channel Sessions
-- ============================================================
INSERT INTO public.channel_sessions (session_id, doctor_id, room_id, created_by, date, start_time, end_time, patient_limit, doctor_fee, status) VALUES
  -- Upcoming sessions
  ('90000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 1,'09:00','12:00',20,2500.00,'scheduled'),
  ('90000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000002',
   'e0000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 2,'14:00','17:00',15,2000.00,'scheduled'),
  ('90000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000003',
   'e0000000-0000-0000-0000-000000000002',
   CURRENT_DATE + 3,'10:00','13:00',20,2500.00,'scheduled'),
  -- Past completed session
  ('90000000-0000-0000-0000-000000000004',
   'c0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000004',
   'e0000000-0000-0000-0000-000000000002',
   CURRENT_DATE - 7,'09:00','12:00',15,2000.00,'completed')
ON CONFLICT (session_id) DO NOTHING;

-- ============================================================
-- STEP 12: Payments + Appointments
-- ============================================================

-- Payment 1
INSERT INTO public.payments (payment_id, doctor_fee, center_fee, platform_fee, tax, total_amount, payment_method, payment_status, transaction_ref) VALUES
  ('p0000000-0000-0000-0000-000000000001',2500,500,150,77.5,3227.5,'card','paid','TXN-001-TEST');

-- Payment 2
INSERT INTO public.payments (payment_id, doctor_fee, center_fee, platform_fee, tax, total_amount, payment_method, payment_status, transaction_ref) VALUES
  ('p0000000-0000-0000-0000-000000000002',2000,400,120,62,2582,'card','paid','TXN-002-TEST');

-- Payment 3 (pending)
INSERT INTO public.payments (payment_id, doctor_fee, center_fee, platform_fee, tax, total_amount, payment_method, payment_status, transaction_ref) VALUES
  ('p0000000-0000-0000-0000-000000000003',2500,500,150,77.5,3227.5,'cash','pending','TXN-003-TEST');

-- Appointments
INSERT INTO public.appointments (appointment_id, session_id, patient_id, payment_id, appointment_number, status) VALUES
  ('ap000000-0000-0000-0000-000000000001',
   '90000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
   'p0000000-0000-0000-0000-000000000001',1,'booked'),
  ('ap000000-0000-0000-0000-000000000002',
   '90000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   'p0000000-0000-0000-0000-000000000002',2,'booked'),
  ('ap000000-0000-0000-0000-000000000003',
   '90000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000003',
   'p0000000-0000-0000-0000-000000000003',1,'booked'),
  -- Completed past appointment
  ('ap000000-0000-0000-0000-000000000004',
   '90000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000001',
   NULL,1,'completed')
ON CONFLICT (appointment_id) DO NOTHING;

-- Link payment_id back to appointment
UPDATE public.payments SET appointment_id = 'ap000000-0000-0000-0000-000000000001' WHERE payment_id = 'p0000000-0000-0000-0000-000000000001';
UPDATE public.payments SET appointment_id = 'ap000000-0000-0000-0000-000000000002' WHERE payment_id = 'p0000000-0000-0000-0000-000000000002';
UPDATE public.payments SET appointment_id = 'ap000000-0000-0000-0000-000000000003' WHERE payment_id = 'p0000000-0000-0000-0000-000000000003';

-- ============================================================
-- STEP 13: Doctor Ratings
-- ============================================================
INSERT INTO public.doctor_ratings (patient_id, doctor_id, rate_value, review) VALUES
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',5,'Excellent doctor, very thorough and caring.'),
  ('b0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001',4,'Very professional and knowledgeable.'),
  ('b0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000002',5,'Great with kids, very patient and kind.'),
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002',4,'Good experience overall.')
ON CONFLICT (patient_id, doctor_id) DO NOTHING;

-- ============================================================
-- STEP 14: Center Ratings
-- ============================================================
INSERT INTO public.center_ratings (patient_id, center_id, rate_value, review) VALUES
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001',5,'Very clean and well-organized centre.'),
  ('b0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000001',4,'Short waiting time, friendly staff.'),
  ('b0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000002',4,'Good facilities, easy parking.')
ON CONFLICT (patient_id, center_id) DO NOTHING;

-- ============================================================
-- STEP 15: Doctor Requests
-- ============================================================
INSERT INTO public.doctor_requests (initiated_by_role, requesting_center_admin_id, doctor_id, center_id, offer_details, request_status) VALUES
  ('center','e0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000001',
   'We would like to invite Dr. Fernando to join our Orthopedics department. Fee: LKR 3000/session.',
   'pending');

-- ============================================================
-- STEP 16: Notifications
-- ============================================================
INSERT INTO public.notifications (user_id, title, body, type, is_read) VALUES
  ('a0000000-0000-0000-0000-000000000007','Appointment Confirmed',
   'Your appointment #1 with Dr. Chaminda Perera on '||(CURRENT_DATE+1)::TEXT||' is confirmed.','appointment',false),
  ('a0000000-0000-0000-0000-000000000008','Appointment Confirmed',
   'Your appointment #2 with Dr. Chaminda Perera on '||(CURRENT_DATE+1)::TEXT||' is confirmed.','appointment',false),
  ('a0000000-0000-0000-0000-000000000004','New Session Scheduled',
   'A new session has been scheduled for you on '||(CURRENT_DATE+1)::TEXT||' at Asiri Medical Centre.','session',false),
  ('a0000000-0000-0000-0000-000000000001','New Doctor Registration',
   'Dr. Rohan Fernando has registered and is awaiting verification.','verification',false),
  ('a0000000-0000-0000-0000-000000000006','Verification Pending',
   'Your profile is under review by the platform admin. You will be notified once approved.','verification',true);

-- ============================================================
-- STEP 17: Messages (doctor <-> center admin)
-- ============================================================
INSERT INTO public.messages (sender_id, receiver_id, center_id, content, is_read) VALUES
  ('a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004',
   'd0000000-0000-0000-0000-000000000001',
   'Dear Dr. Perera, please confirm your availability for next week sessions.', false),
  ('a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000002',
   'd0000000-0000-0000-0000-000000000001',
   'Hello, I am available Monday and Wednesday mornings. Please schedule accordingly.', true);

-- ============================================================
-- DONE — Test credentials:
-- platform_admin : admin@channellanka.lk     / Admin@1234
-- center_admin1  : cadmin1@channellanka.lk   / Admin@1234
-- center_admin2  : cadmin2@channellanka.lk   / Admin@1234
-- doctor1        : dr.perera@channellanka.lk / Doctor@1234  (approved)
-- doctor2        : dr.silva@channellanka.lk  / Doctor@1234  (approved)
-- doctor3        : dr.fernando@channellanka.lk/ Doctor@1234 (pending)
-- patient1       : patient1@gmail.com        / Patient@1234
-- patient2       : patient2@gmail.com        / Patient@1234
-- patient3       : patient3@gmail.com        / Patient@1234
-- ============================================================
