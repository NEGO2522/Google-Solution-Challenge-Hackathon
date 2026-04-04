-- ================================================================
--  ReliefLink — FULL SETUP SCRIPT (run this once in SQL Editor)
--  Supabase Dashboard → SQL Editor → New Query → paste → Run
-- ================================================================

-- ── Extensions ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── updated_at trigger function ────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ================================================================
--  TABLES
-- ================================================================

-- 1. VOLUNTEER PROFILES
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  city                TEXT,
  skills              TEXT[]   DEFAULT '{}',
  availability        TEXT,
  location            GEOGRAPHY(POINT, 4326),
  lat                 DOUBLE PRECISION,
  lng                 DOUBLE PRECISION,
  phone_verified      BOOLEAN  DEFAULT FALSE,
  doc_url             TEXT,
  verified            BOOLEAN  DEFAULT FALSE,
  verification_status TEXT     DEFAULT 'pending',
  trust_score         DOUBLE PRECISION DEFAULT 0,
  tasks_completed     INTEGER  DEFAULT 0,
  tasks_accepted      INTEGER  DEFAULT 0,
  avg_rating          DOUBLE PRECISION DEFAULT 0,
  total_ratings       INTEGER  DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NGO ADMIN PROFILES
CREATE TABLE IF NOT EXISTS ngo_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  ngo_name        TEXT NOT NULL,
  ngo_reg_number  TEXT,
  ngo_city        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OTP VERIFICATIONS
CREATE TABLE IF NOT EXISTS otp_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  otp_code    TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ISSUES
CREATE TABLE IF NOT EXISTS issues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name   TEXT,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  urgency         TEXT,
  status          TEXT DEFAULT 'open',
  address         TEXT,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  location        GEOGRAPHY(POINT, 4326),
  image_url       TEXT,
  assigned_to     UUID REFERENCES volunteer_profiles(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TASK ASSIGNMENTS
CREATE TABLE IF NOT EXISTS task_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id        UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  volunteer_id    UUID NOT NULL REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
  assigned_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'pending',
  accepted_at     TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  proof_text      TEXT,
  proof_image_url TEXT,
  volunteer_notes TEXT,
  admin_notes     TEXT,
  match_score     DOUBLE PRECISION,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RATINGS
CREATE TABLE IF NOT EXISTS ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  rated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  volunteer_id  UUID NOT NULL REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  data       JSONB DEFAULT '{}',
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
--  TRIGGERS
-- ================================================================
DROP TRIGGER IF EXISTS trg_volunteer_updated_at   ON volunteer_profiles;
DROP TRIGGER IF EXISTS trg_issues_updated_at      ON issues;
DROP TRIGGER IF EXISTS trg_assignments_updated_at ON task_assignments;

CREATE TRIGGER trg_volunteer_updated_at
  BEFORE UPDATE ON volunteer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON task_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
--  ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE volunteer_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues               ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DO $$ BEGIN
  DROP POLICY IF EXISTS "volunteers_read_all"    ON volunteer_profiles;
  DROP POLICY IF EXISTS "volunteers_own_write"   ON volunteer_profiles;
  DROP POLICY IF EXISTS "ngo_read_all"           ON ngo_profiles;
  DROP POLICY IF EXISTS "ngo_own_write"          ON ngo_profiles;
  DROP POLICY IF EXISTS "otp_own"                ON otp_verifications;
  DROP POLICY IF EXISTS "issues_read_all"        ON issues;
  DROP POLICY IF EXISTS "issues_insert_auth"     ON issues;
  DROP POLICY IF EXISTS "issues_update_auth"     ON issues;
  DROP POLICY IF EXISTS "assignments_read_all"   ON task_assignments;
  DROP POLICY IF EXISTS "assignments_insert_auth"ON task_assignments;
  DROP POLICY IF EXISTS "assignments_update_auth"ON task_assignments;
  DROP POLICY IF EXISTS "ratings_read_all"       ON ratings;
  DROP POLICY IF EXISTS "ratings_insert_auth"    ON ratings;
  DROP POLICY IF EXISTS "notif_own"              ON notifications;
END $$;

-- volunteer_profiles: anyone reads, own user writes
CREATE POLICY "volunteers_read_all"  ON volunteer_profiles FOR SELECT USING (true);
CREATE POLICY "volunteers_own_write" ON volunteer_profiles FOR ALL    USING (auth.uid() = id);

-- ngo_profiles: anyone reads, own user writes
CREATE POLICY "ngo_read_all"         ON ngo_profiles FOR SELECT USING (true);
CREATE POLICY "ngo_own_write"        ON ngo_profiles FOR ALL    USING (auth.uid() = id);

-- otp_verifications: only own rows
CREATE POLICY "otp_own"              ON otp_verifications FOR ALL USING (auth.uid() = user_id);

-- issues: anyone reads, authenticated inserts, authenticated updates
CREATE POLICY "issues_read_all"      ON issues FOR SELECT USING (true);
CREATE POLICY "issues_insert_auth"   ON issues FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "issues_update_auth"   ON issues FOR UPDATE USING (auth.uid() IS NOT NULL);

-- task_assignments: anyone reads, authenticated writes
CREATE POLICY "assignments_read_all"    ON task_assignments FOR SELECT USING (true);
CREATE POLICY "assignments_insert_auth" ON task_assignments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "assignments_update_auth" ON task_assignments FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ratings: anyone reads, authenticated inserts
CREATE POLICY "ratings_read_all"     ON ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert_auth"  ON ratings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- notifications: only own rows
CREATE POLICY "notif_own"            ON notifications FOR ALL USING (auth.uid() = user_id);

-- ================================================================
--  FUNCTIONS
-- ================================================================

-- volunteers_near: find volunteers within radius
CREATE OR REPLACE FUNCTION volunteers_near(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID, name TEXT, city TEXT, skills TEXT[],
  availability TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION,
  distance_km DOUBLE PRECISION, verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vp.id, vp.name, vp.city, vp.skills, vp.availability, vp.lat, vp.lng,
    ROUND((ST_Distance(
      vp.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000)::numeric, 1)::double precision AS distance_km,
    vp.verified
  FROM volunteer_profiles vp
  WHERE vp.location IS NOT NULL
    AND ST_DWithin(
      vp.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- recalculate_trust_score
CREATE OR REPLACE FUNCTION recalculate_trust_score(p_volunteer_id UUID)
RETURNS VOID AS $$
DECLARE
  v_completed   INTEGER;
  v_accepted    INTEGER;
  v_avg_rating  DOUBLE PRECISION;
  v_total_rtg   INTEGER;
  v_score       DOUBLE PRECISION;
BEGIN
  SELECT COUNT(*) INTO v_completed
    FROM task_assignments WHERE volunteer_id = p_volunteer_id AND status = 'completed';
  SELECT COUNT(*) INTO v_accepted
    FROM task_assignments WHERE volunteer_id = p_volunteer_id AND status IN ('accepted','in_progress','completed');
  SELECT COALESCE(AVG(rating),0), COUNT(*) INTO v_avg_rating, v_total_rtg
    FROM ratings WHERE volunteer_id = p_volunteer_id;

  v_score := (v_avg_rating / 5.0 * 40)
           + (CASE WHEN v_accepted > 0 THEN LEAST(v_completed::float / v_accepted, 1.0) ELSE 0 END * 40)
           + (LEAST(v_completed, 10) / 10.0 * 20);

  UPDATE volunteer_profiles SET
    trust_score     = ROUND(v_score::numeric, 1),
    tasks_completed = v_completed,
    tasks_accepted  = v_accepted,
    avg_rating      = ROUND(v_avg_rating::numeric, 2),
    total_ratings   = v_total_rtg,
    updated_at      = NOW()
  WHERE id = p_volunteer_id;
END;
$$ LANGUAGE plpgsql;

-- smart_match_volunteers: AI scoring for issue→volunteer matching
CREATE OR REPLACE FUNCTION smart_match_volunteers(
  p_issue_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  volunteer_id    UUID,
  name            TEXT,
  skills          TEXT[],
  city            TEXT,
  distance_km     DOUBLE PRECISION,
  trust_score     DOUBLE PRECISION,
  avg_rating      DOUBLE PRECISION,
  tasks_completed INTEGER,
  match_score     DOUBLE PRECISION,
  skill_match     BOOLEAN,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION
) AS $$
DECLARE
  v_lat       DOUBLE PRECISION;
  v_lng       DOUBLE PRECISION;
  v_category  TEXT;
  v_urgency   TEXT;
  v_radius_km DOUBLE PRECISION;
BEGIN
  SELECT i.lat, i.lng, i.category, i.urgency
    INTO v_lat, v_lng, v_category, v_urgency
    FROM issues i WHERE i.id = p_issue_id;

  v_radius_km := CASE v_urgency
    WHEN 'critical' THEN 200
    WHEN 'high'     THEN 100
    WHEN 'medium'   THEN 75
    ELSE 50
  END;

  RETURN QUERY
  SELECT
    vp.id,
    vp.name,
    vp.skills,
    vp.city,
    ROUND((ST_Distance(
      vp.location,
      ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography
    ) / 1000)::numeric, 1)::double precision AS distance_km,
    vp.trust_score,
    vp.avg_rating,
    vp.tasks_completed,
    ROUND((
      (CASE WHEN vp.skills @> ARRAY[v_category] OR vp.skills && ARRAY[v_category] THEN 35 ELSE 0 END)
      + (30 * GREATEST(0, 1 - (ST_Distance(
            vp.location,
            ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography
          ) / 1000) / v_radius_km))
      + (vp.trust_score / 100.0 * 25)
      + (CASE WHEN vp.availability IS NOT NULL AND vp.availability != 'unavailable' THEN 10 ELSE 0 END)
    )::numeric, 1)::double precision AS match_score,
    (vp.skills @> ARRAY[v_category] OR vp.skills && ARRAY[v_category]) AS skill_match,
    vp.lat,
    vp.lng
  FROM volunteer_profiles vp
  WHERE vp.location IS NOT NULL
    AND vp.verified = TRUE
    AND ST_DWithin(
      vp.location,
      ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography,
      v_radius_km * 1000
    )
    AND NOT EXISTS (
      SELECT 1 FROM task_assignments ta
      WHERE ta.issue_id = p_issue_id
        AND ta.volunteer_id = vp.id
        AND ta.status NOT IN ('declined','cancelled')
    )
  ORDER BY match_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
--  STORAGE BUCKET (run separately if needed)
-- ================================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('volunteer-docs', 'volunteer-docs', false)
-- ON CONFLICT DO NOTHING;

-- ================================================================
--  VERIFY — should return 7 table names
-- ================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'volunteer_profiles','ngo_profiles','otp_verifications',
    'issues','task_assignments','ratings','notifications'
  )
ORDER BY table_name;
