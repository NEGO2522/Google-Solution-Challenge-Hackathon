-- ================================================================
--  ReliefLink — Seed Demo Volunteers (FK-safe approach)
--  Run this in Supabase SQL Editor
--  This creates fake auth.users entries first, then profiles
-- ================================================================

-- Step 1: Insert fake users into auth.users (requires service role / SQL editor)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_user_meta_data, role, aud
) VALUES
  ('11111111-1111-4111-1111-111111111101', 'arjun.sharma@demo.com',   '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Arjun Sharma",  "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111102', 'priya.verma@demo.com',    '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Priya Verma",   "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111103', 'rahul.gupta@demo.com',    '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Rahul Gupta",   "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111104', 'sneha.patel@demo.com',    '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Sneha Patel",   "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111105', 'vikram.singh@demo.com',   '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Vikram Singh",  "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111106', 'anita.meena@demo.com',    '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Anita Meena",   "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111107', 'deepak.joshi@demo.com',   '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Deepak Joshi",  "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111108', 'kavya.rajput@demo.com',   '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Kavya Rajput",  "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111109', 'amit.kumar@demo.com',     '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Amit Kumar",    "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111110', 'ritu.sharma@demo.com',    '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Ritu Sharma",   "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111111', 'suresh.yadav@demo.com',   '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Suresh Yadav",  "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111112', 'pooja.agarwal@demo.com',  '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Pooja Agarwal", "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111113', 'rajesh.nagar@demo.com',   '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Rajesh Nagar",  "role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111114', 'meera.bhandari@demo.com', '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Meera Bhandari","role":"volunteer"}', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-1111-111111111115', 'karan.mehta@demo.com',    '$2a$10$demo', NOW(), NOW(), NOW(), '{"name":"Karan Mehta",   "role":"volunteer"}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert volunteer profiles
INSERT INTO volunteer_profiles (
  id, name, email, phone, city,
  skills, availability,
  lat, lng, location,
  verified, verification_status,
  trust_score, avg_rating, tasks_completed, tasks_accepted, total_ratings
) VALUES
  ('11111111-1111-4111-1111-111111111101', 'Arjun Sharma',   'arjun.sharma@demo.com',   '+91 9876543210', 'Jaipur',    ARRAY['Medical Aid','Rescue Operations'],              'Weekdays (9am–5pm)', 26.9124, 75.7873, ST_SetSRID(ST_MakePoint(75.7873,26.9124),4326)::geography, true, 'approved', 72.5, 4.3, 8,  10, 6 ),
  ('11111111-1111-4111-1111-111111111102', 'Priya Verma',    'priya.verma@demo.com',    '+91 9876543211', 'Jaipur',    ARRAY['Teaching','Counseling'],                        'Weekends Only',      26.8950, 75.8045, ST_SetSRID(ST_MakePoint(75.8045,26.8950),4326)::geography, true, 'approved', 85.0, 4.8, 12, 13, 10),
  ('11111111-1111-4111-1111-111111111103', 'Rahul Gupta',    'rahul.gupta@demo.com',    '+91 9876543212', 'Jaipur',    ARRAY['Logistics','Food Distribution'],                'Full-Time',          26.9260, 75.8235, ST_SetSRID(ST_MakePoint(75.8235,26.9260),4326)::geography, true, 'approved', 65.0, 4.0, 6,  8,  5 ),
  ('11111111-1111-4111-1111-111111111104', 'Sneha Patel',    'sneha.patel@demo.com',    '+91 9876543213', 'Ajmer',     ARRAY['Medical Aid','Counseling','Legal Aid'],         'Evenings',           26.4499, 74.6399, ST_SetSRID(ST_MakePoint(74.6399,26.4499),4326)::geography, true, 'approved', 91.5, 4.9, 20, 21, 15),
  ('11111111-1111-4111-1111-111111111105', 'Vikram Singh',   'vikram.singh@demo.com',   '+91 9876543214', 'Kota',      ARRAY['Rescue Operations','Construction'],             'On-Call',            25.2138, 75.8648, ST_SetSRID(ST_MakePoint(75.8648,25.2138),4326)::geography, true, 'approved', 55.0, 3.8, 4,  5,  3 ),
  ('11111111-1111-4111-1111-111111111106', 'Anita Meena',    'anita.meena@demo.com',    '+91 9876543215', 'Jaipur',    ARRAY['Teaching','Translation','Photography'],         'Weekdays (9am–5pm)', 26.9010, 75.7720, ST_SetSRID(ST_MakePoint(75.7720,26.9010),4326)::geography, true, 'approved', 78.0, 4.5, 9,  10, 7 ),
  ('11111111-1111-4111-1111-111111111107', 'Deepak Joshi',   'deepak.joshi@demo.com',   '+91 9876543216', 'Udaipur',   ARRAY['IT Support','Fundraising'],                    'Weekends Only',      24.5854, 73.7125, ST_SetSRID(ST_MakePoint(73.7125,24.5854),4326)::geography, true, 'approved', 60.0, 4.1, 5,  7,  4 ),
  ('11111111-1111-4111-1111-111111111108', 'Kavya Rajput',   'kavya.rajput@demo.com',   '+91 9876543217', 'Jodhpur',   ARRAY['Medical Aid','Food Distribution','Counseling'], 'Full-Time',          26.2389, 73.0243, ST_SetSRID(ST_MakePoint(73.0243,26.2389),4326)::geography, true, 'approved', 88.0, 4.7, 15, 16, 12),
  ('11111111-1111-4111-1111-111111111109', 'Amit Kumar',     'amit.kumar@demo.com',     '+91 9876543218', 'Jaipur',    ARRAY['Logistics','Construction','Rescue Operations'], 'On-Call',            26.9350, 75.7550, ST_SetSRID(ST_MakePoint(75.7550,26.9350),4326)::geography, true, 'approved', 70.0, 4.2, 7,  9,  6 ),
  ('11111111-1111-4111-1111-111111111110', 'Ritu Sharma',    'ritu.sharma@demo.com',    '+91 9876543219', 'Sikar',     ARRAY['Teaching','Legal Aid'],                        'Evenings',           27.6094, 75.1399, ST_SetSRID(ST_MakePoint(75.1399,27.6094),4326)::geography, true, 'approved', 50.0, 3.5, 3,  4,  2 ),
  ('11111111-1111-4111-1111-111111111111', 'Suresh Yadav',   'suresh.yadav@demo.com',   '+91 9876543220', 'Bharatpur', ARRAY['Food Distribution','Logistics'],                'Weekdays (9am–5pm)', 27.2152, 77.4933, ST_SetSRID(ST_MakePoint(77.4933,27.2152),4326)::geography, true, 'approved', 62.0, 4.0, 5,  6,  4 ),
  ('11111111-1111-4111-1111-111111111112', 'Pooja Agarwal',  'pooja.agarwal@demo.com',  '+91 9876543221', 'Alwar',     ARRAY['Medical Aid','Photography','Fundraising'],      'Weekends Only',      27.5635, 76.6346, ST_SetSRID(ST_MakePoint(76.6346,27.5635),4326)::geography, true, 'approved', 80.0, 4.6, 11, 12, 9 ),
  ('11111111-1111-4111-1111-111111111113', 'Rajesh Nagar',   'rajesh.nagar@demo.com',   '+91 9876543222', 'Jaipur',    ARRAY['Rescue Operations','IT Support','Translation'], 'Full-Time',          26.8800, 75.8100, ST_SetSRID(ST_MakePoint(75.8100,26.8800),4326)::geography, true, 'approved', 95.0, 5.0, 25, 26, 20),
  ('11111111-1111-4111-1111-111111111114', 'Meera Bhandari', 'meera.bhandari@demo.com', '+91 9876543223', 'Jaipur',    ARRAY['Counseling','Teaching','Medical Aid'],          'On-Call',            26.9200, 75.7900, ST_SetSRID(ST_MakePoint(75.7900,26.9200),4326)::geography, true, 'approved', 76.0, 4.4, 10, 11, 8 ),
  ('11111111-1111-4111-1111-111111111115', 'Karan Mehta',    'karan.mehta@demo.com',    '+91 9876543224', 'Bikaner',   ARRAY['Construction','Food Distribution'],             'Evenings',           28.0229, 73.3119, ST_SetSRID(ST_MakePoint(73.3119,28.0229),4326)::geography, true, 'approved', 45.0, 3.2, 2,  3,  2 )
ON CONFLICT (id) DO UPDATE SET
  trust_score      = EXCLUDED.trust_score,
  avg_rating       = EXCLUDED.avg_rating,
  tasks_completed  = EXCLUDED.tasks_completed,
  tasks_accepted   = EXCLUDED.tasks_accepted,
  total_ratings    = EXCLUDED.total_ratings,
  verified         = EXCLUDED.verified,
  updated_at       = NOW();

-- Verify
SELECT name, city, trust_score, avg_rating, tasks_completed
FROM volunteer_profiles
ORDER BY trust_score DESC;
