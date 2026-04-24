-- ================================================================
--  VolunteerBridge — FULL DEMO SEED SCRIPT
--  Run this in Supabase SQL Editor AFTER supabase_FULL_SETUP.sql
--
--  Creates:
--  ✅ Demo volunteer user  → volunteer@demo.volunteerbridge.in
--  ✅ Demo admin user      → admin@demo.volunteerbridge.in
--  ✅ Verified volunteer profile with trust score, skills, location
--  ✅ NGO admin profile
--  ✅ 8 realistic open/in-progress/resolved issues
--  ✅ Task assignments (completed, in_progress, accepted)
--  ✅ Ratings for completed tasks
--  ✅ Notifications for both users
--  Password for both: Demo@1234
-- ================================================================

-- ── STEP 1: Create demo auth users ──────────────────────────────
-- Uses bcrypt hash of "Demo@1234"
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  role,
  aud,
  is_sso_user,
  deleted_at
) VALUES
  (
    'dddddddd-0000-4000-a000-000000000001',
    'volunteer@demo.volunteerbridge.in',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy',
    NOW(), NOW(), NOW(), NOW(),
    '{"name":"Rahul Sharma","role":"volunteer","city":"Jaipur","skills":["Medical Aid","Logistics","Teaching"],"availability":"On-Call"}',
    '{"provider":"email","providers":["email"]}',
    'authenticated', 'authenticated', false, null
  ),
  (
    'dddddddd-0000-4000-a000-000000000002',
    'admin@demo.volunteerbridge.in',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy',
    NOW(), NOW(), NOW(), NOW(),
    '{"name":"Priya NGO Admin","role":"ngo_admin","ngoName":"HelpIndia Foundation","ngoCity":"Jaipur"}',
    '{"provider":"email","providers":["email"]}',
    'authenticated', 'authenticated', false, null
  )
ON CONFLICT (id) DO UPDATE SET
  encrypted_password  = EXCLUDED.encrypted_password,
  email_confirmed_at  = EXCLUDED.email_confirmed_at,
  confirmed_at        = EXCLUDED.confirmed_at,
  raw_user_meta_data  = EXCLUDED.raw_user_meta_data,
  updated_at          = NOW();

-- Also insert into auth.identities so login works
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    'dddddddd-0000-4000-a000-000000000001',
    'dddddddd-0000-4000-a000-000000000001',
    '{"sub":"dddddddd-0000-4000-a000-000000000001","email":"volunteer@demo.volunteerbridge.in"}',
    'email',
    'dddddddd-0000-4000-a000-000000000001',
    NOW(), NOW(), NOW()
  ),
  (
    'dddddddd-0000-4000-a000-000000000002',
    'dddddddd-0000-4000-a000-000000000002',
    '{"sub":"dddddddd-0000-4000-a000-000000000002","email":"admin@demo.volunteerbridge.in"}',
    'email',
    'dddddddd-0000-4000-a000-000000000002',
    NOW(), NOW(), NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at    = NOW();

-- ── STEP 2: Volunteer profile — fully verified, strong trust score ─
INSERT INTO volunteer_profiles (
  id, name, email, phone, city,
  skills, availability,
  lat, lng, location,
  phone_verified, doc_url,
  verified, verification_status,
  trust_score, avg_rating, tasks_completed, tasks_accepted, total_ratings,
  created_at, updated_at
) VALUES (
  'dddddddd-0000-4000-a000-000000000001',
  'Rahul Sharma',
  'volunteer@demo.volunteerbridge.in',
  '+91 9876543200',
  'Jaipur',
  ARRAY['Medical Aid','Logistics','Teaching','Rescue Operations'],
  'On-Call',
  26.9124, 75.7873,
  ST_SetSRID(ST_MakePoint(75.7873, 26.9124), 4326)::geography,
  true,
  'https://placeholder.com/doc.pdf',
  true,
  'approved',
  72.0, 4.3, 5, 7, 5,
  NOW() - INTERVAL '30 days',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  verified            = true,
  verification_status = 'approved',
  phone_verified      = true,
  trust_score         = 72.0,
  avg_rating          = 4.3,
  tasks_completed     = 5,
  tasks_accepted      = 7,
  total_ratings       = 5,
  skills              = ARRAY['Medical Aid','Logistics','Teaching','Rescue Operations'],
  updated_at          = NOW();

-- ── STEP 3: NGO admin profile ────────────────────────────────────
INSERT INTO ngo_profiles (
  id, name, email, ngo_name, ngo_reg_number, ngo_city, created_at
) VALUES (
  'dddddddd-0000-4000-a000-000000000002',
  'Priya NGO Admin',
  'admin@demo.volunteerbridge.in',
  'HelpIndia Foundation',
  'NGO/RAJ/2022/00142',
  'Jaipur',
  NOW() - INTERVAL '60 days'
)
ON CONFLICT (id) DO UPDATE SET
  ngo_name       = EXCLUDED.ngo_name,
  ngo_reg_number = EXCLUDED.ngo_reg_number,
  ngo_city       = EXCLUDED.ngo_city;

-- ── STEP 4: Issues — mix of open, in_progress, resolved ──────────
INSERT INTO issues (
  id, reported_by, reporter_name,
  title, description, category, urgency, status,
  address, lat, lng, location,
  created_at, updated_at
) VALUES
  (
    'eeeeeeee-0000-4000-a000-000000000001',
    'dddddddd-0000-4000-a000-000000000002',
    'Priya NGO Admin',
    'Flood victims need food & shelter near Mansarovar',
    'Approximately 200 flood-affected families displaced near Mansarovar Colony. Urgent need for food packets, clean water, and temporary shelter. Children and elderly at risk. Volunteers with logistics experience preferred.',
    'Food Distribution',
    'critical',
    'open',
    'Mansarovar Colony, Jaipur, Rajasthan',
    26.8550, 75.7500,
    ST_SetSRID(ST_MakePoint(75.7500, 26.8550), 4326)::geography,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'eeeeeeee-0000-4000-a000-000000000002',
    'dddddddd-0000-4000-a000-000000000002',
    'Priya NGO Admin',
    'Medical camp needed at Sanganer — dengue outbreak',
    'Dengue cases rising in Sanganer slum area. Over 50 families affected, no local medical facility within 5 km. Need medical volunteers for screening, first aid, and awareness drive.',
    'Medical Aid',
    'high',
    'in_progress',
    'Sanganer, Jaipur, Rajasthan',
    26.7918, 75.8150,
    ST_SetSRID(ST_MakePoint(75.8150, 26.7918), 4326)::geography,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '4 hours'
  ),
  (
    'eeeeeeee-0000-4000-a000-000000000003',
    'dddddddd-0000-4000-a000-000000000002',
    'Priya NGO Admin',
    'Fire rescue support needed — Malviya Nagar',
    'Fire broke out in a 3-storey residential building in Malviya Nagar. Fire department has contained the blaze but 12 families are displaced and need rescue support, blankets, and food.',
    'Rescue Operations',
    'critical',
    'resolved',
    'Malviya Nagar, Jaipur, Rajasthan',
    26.8617, 75.8070,
    ST_SetSRID(ST_MakePoint(75.8070, 26.8617), 4326)::geography,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
  ),
  (
    'eeeeeeee-0000-4000-a000-000000000004',
    'dddddddd-0000-4000-a000-000000000002',
    'Priya NGO Admin',
    'Teaching volunteers for flood-affected children',
    'Over 300 children out of school due to flood damage in Tonk Road area. Temporary learning centre set up but need 5 teaching volunteers for basic literacy and trauma counseling.',
    'Teaching',
    'medium',
    'open',
    'Tonk Road, Jaipur, Rajasthan',
    26.8730, 75.8330,
    ST_SetSRID(ST_MakePoint(75.8330, 26.8730), 4326)::geography,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
  ),
  (
    'eeeeeeee-0000-4000-a000-000000000005',
    'dddddddd-0000-4000-a000-000000000002',
    'Priya NGO Admin',
    'Logistics support — relief material distribution, C-Scheme',
    'Large donation of relief materials received at C-Scheme warehouse. Need 10 logistics volunteers for sorting, packing, and distribution to 5 relief camps across Jaipur.',
    'Logistics',
    'high',
    'open',
    'C-Scheme, Jaipur, Rajasthan',
    26.9124, 75.8051,
    ST_SetSRID(ST_MakePoint(75.8051, 26.9124), 4326)::geography,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
  ),
  (
    'eeeeeeee-0000-4000-a000-000000000006',
    'dddddddd-0000-4000-a000-000000000002',
    'Priya NGO Admin',
    'Elderly care volunteers needed — Vaishali Nagar',
    'Heat wave affecting elderly population in Vaishali Nagar. 40+ senior citizens living alone need daily visits, hydration checks, and medication support. 1-week assignment.',
    'Medical Aid',
    'medium',
    'resolved',
    'Vaishali Nagar, Jaipur, Rajasthan',
    26.9344, 75.7420,
    ST_SetSRID(ST_MakePoint(75.7420, 26.9344), 4326)::geography,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days'
  ),
  (
    'eeeeeeee-0000-4000-a000-000000000007',
    'dddddddd-0000-4000-a000-000000000002',
    'Priya NGO Admin',
    'Counseling support — trauma cases after building collapse',
    'Building collapse at Gopalbari affected 18 families. Physical rescue complete but victims need psychological first aid and trauma counseling. Certified counselors preferred.',
    'Counseling',
    'high',
    'open',
    'Gopalbari, Jaipur, Rajasthan',
    26.9178, 75.8041,
    ST_SetSRID(ST_MakePoint(75.8041, 26.9178), 4326)::geography,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
  ),
  (
    'eeeeeeee-0000-4000-a000-000000000008',
    'dddddddd-0000-4000-a000-000000000002',
    'Priya NGO Admin',
    'Food distribution drive — Pratap Nagar slum',
    'Weekly food distribution for 500 families in Pratap Nagar slum. Need 8 volunteers for packing and distribution. Recurring every Sunday 8am–2pm.',
    'Food Distribution',
    'low',
    'in_progress',
    'Pratap Nagar, Jaipur, Rajasthan',
    26.8300, 75.7800,
    ST_SetSRID(ST_MakePoint(75.7800, 26.8300), 4326)::geography,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO UPDATE SET
  status     = EXCLUDED.status,
  updated_at = NOW();

-- ── STEP 5: Task assignments for the demo volunteer ───────────────
-- completed task (resolved issue)
INSERT INTO task_assignments (
  id, issue_id, volunteer_id,
  status, assigned_at, accepted_at, started_at, completed_at,
  completion_note, created_at, updated_at
) VALUES
  (
    'ffffffff-0000-4000-a000-000000000001',
    'eeeeeeee-0000-4000-a000-000000000003',
    'dddddddd-0000-4000-a000-000000000001',
    'completed',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '10 minutes',
    NOW() - INTERVAL '5 days' + INTERVAL '30 minutes',
    NOW() - INTERVAL '4 days',
    'Successfully assisted 12 displaced families. Distributed food and blankets. Connected families with local shelter. All members accounted for.',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
  ),
  (
    'ffffffff-0000-4000-a000-000000000002',
    'eeeeeeee-0000-4000-a000-000000000006',
    'dddddddd-0000-4000-a000-000000000001',
    'completed',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '5 minutes',
    NOW() - INTERVAL '10 days' + INTERVAL '1 hour',
    NOW() - INTERVAL '8 days',
    'Visited 40 senior citizens over 7 days. Arranged medication delivery for 12 who needed prescription refills. All are stable now.',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days'
  ),
  (
    'ffffffff-0000-4000-a000-000000000003',
    'eeeeeeee-0000-4000-a000-000000000002',
    'dddddddd-0000-4000-a000-000000000001',
    'in_progress',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '15 minutes',
    NOW() - INTERVAL '20 hours',
    null,
    null,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '20 hours'
  ),
  (
    'ffffffff-0000-4000-a000-000000000004',
    'eeeeeeee-0000-4000-a000-000000000005',
    'dddddddd-0000-4000-a000-000000000001',
    'accepted',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 45 minutes',
    null, null, null,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 45 minutes'
  )
ON CONFLICT (id) DO UPDATE SET
  status     = EXCLUDED.status,
  updated_at = NOW();

-- ── STEP 6: Ratings for the 2 completed tasks ─────────────────────
INSERT INTO ratings (
  id, assignment_id, issue_id, volunteer_id, rated_by,
  rating, feedback, created_at
) VALUES
  (
    'aaaaaaaa-0000-4000-a000-000000000001',
    'ffffffff-0000-4000-a000-000000000001',
    'eeeeeeee-0000-4000-a000-000000000003',
    'dddddddd-0000-4000-a000-000000000001',
    'dddddddd-0000-4000-a000-000000000002',
    5,
    'Rahul was exceptional. Arrived within 30 minutes and took charge immediately. Highly reliable volunteer.',
    NOW() - INTERVAL '4 days'
  ),
  (
    'aaaaaaaa-0000-4000-a000-000000000002',
    'ffffffff-0000-4000-a000-000000000002',
    'eeeeeeee-0000-4000-a000-000000000006',
    'dddddddd-0000-4000-a000-000000000001',
    'dddddddd-0000-4000-a000-000000000002',
    4,
    'Very dedicated and compassionate. Went above and beyond to ensure elderly residents were comfortable.',
    NOW() - INTERVAL '8 days'
  )
ON CONFLICT (id) DO UPDATE SET
  rating   = EXCLUDED.rating,
  feedback = EXCLUDED.feedback;

-- ── STEP 7: Notifications for both users ─────────────────────────
INSERT INTO notifications (
  id, user_id, type, title, message, read, related_id, created_at
) VALUES
  -- Volunteer notifications
  (
    'bbbbbbbb-0000-4000-a000-000000000001',
    'dddddddd-0000-4000-a000-000000000001',
    'task_assigned',
    'New task assigned',
    'You have been assigned to: Medical camp needed at Sanganer — dengue outbreak',
    false,
    'eeeeeeee-0000-4000-a000-000000000002',
    NOW() - INTERVAL '1 day'
  ),
  (
    'bbbbbbbb-0000-4000-a000-000000000002',
    'dddddddd-0000-4000-a000-000000000001',
    'task_assigned',
    'New task assigned',
    'You have been assigned to: Logistics support — relief material distribution, C-Scheme',
    false,
    'eeeeeeee-0000-4000-a000-000000000005',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'bbbbbbbb-0000-4000-a000-000000000003',
    'dddddddd-0000-4000-a000-000000000001',
    'rating_received',
    'You received a 5★ rating!',
    'HelpIndia Foundation rated you 5 stars for the Fire rescue support task. Great work!',
    true,
    'eeeeeeee-0000-4000-a000-000000000003',
    NOW() - INTERVAL '4 days'
  ),
  (
    'bbbbbbbb-0000-4000-a000-000000000004',
    'dddddddd-0000-4000-a000-000000000001',
    'rating_received',
    'You received a 4★ rating',
    'HelpIndia Foundation rated you 4 stars for the Elderly care task. Keep it up!',
    true,
    'eeeeeeee-0000-4000-a000-000000000006',
    NOW() - INTERVAL '8 days'
  ),
  (
    'bbbbbbbb-0000-4000-a000-000000000005',
    'dddddddd-0000-4000-a000-000000000001',
    'profile_approved',
    'Profile verified ✅',
    'Your volunteer profile has been verified by HelpIndia Foundation. You can now receive task assignments.',
    true,
    null,
    NOW() - INTERVAL '25 days'
  ),
  -- Admin notifications
  (
    'bbbbbbbb-0000-4000-a000-000000000006',
    'dddddddd-0000-4000-a000-000000000002',
    'task_completed',
    'Task completed',
    'Rahul Sharma completed: Fire rescue support needed — Malviya Nagar',
    true,
    'eeeeeeee-0000-4000-a000-000000000003',
    NOW() - INTERVAL '4 days'
  ),
  (
    'bbbbbbbb-0000-4000-a000-000000000007',
    'dddddddd-0000-4000-a000-000000000002',
    'task_completed',
    'Task completed',
    'Rahul Sharma completed: Elderly care volunteers needed — Vaishali Nagar',
    true,
    'eeeeeeee-0000-4000-a000-000000000006',
    NOW() - INTERVAL '8 days'
  ),
  (
    'bbbbbbbb-0000-4000-a000-000000000008',
    'dddddddd-0000-4000-a000-000000000002',
    'task_accepted',
    'Task accepted',
    'Rahul Sharma accepted: Logistics support — relief material distribution, C-Scheme',
    false,
    'eeeeeeee-0000-4000-a000-000000000005',
    NOW() - INTERVAL '1 hour 45 minutes'
  )
ON CONFLICT (id) DO UPDATE SET
  read       = EXCLUDED.read,
  updated_at = NOW();

-- ── STEP 8: Recalculate trust score for demo volunteer ────────────
SELECT recalculate_trust_score('dddddddd-0000-4000-a000-000000000001');

-- ── VERIFY ────────────────────────────────────────────────────────
SELECT 'Demo volunteer profile:' AS check_item;
SELECT name, city, trust_score, avg_rating, tasks_completed, verified, verification_status
FROM volunteer_profiles
WHERE id = 'dddddddd-0000-4000-a000-000000000001';

SELECT 'Demo admin profile:' AS check_item;
SELECT name, ngo_name, ngo_city
FROM ngo_profiles
WHERE id = 'dddddddd-0000-4000-a000-000000000002';

SELECT 'Issues created:' AS check_item;
SELECT COUNT(*) AS total_issues, status FROM issues
WHERE reported_by = 'dddddddd-0000-4000-a000-000000000002'
GROUP BY status ORDER BY status;

SELECT 'Task assignments:' AS check_item;
SELECT status, COUNT(*) FROM task_assignments
WHERE volunteer_id = 'dddddddd-0000-4000-a000-000000000001'
GROUP BY status;

SELECT 'Notifications:' AS check_item;
SELECT user_id = 'dddddddd-0000-4000-a000-000000000001' AS is_volunteer,
       COUNT(*) AS notif_count
FROM notifications
WHERE user_id IN (
  'dddddddd-0000-4000-a000-000000000001',
  'dddddddd-0000-4000-a000-000000000002'
)
GROUP BY is_volunteer;
