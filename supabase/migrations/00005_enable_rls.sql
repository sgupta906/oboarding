-- =============================================================================
-- Migration 00005: Enable Row Level Security (16 tables)
-- =============================================================================
-- Purpose: Enables RLS on all 16 tables and creates permissive "allow all"
--          policies. This mirrors the current Firestore security rules which
--          allow unrestricted read/write access.
-- Note:    These permissive policies are TEMPORARY. They will be replaced with
--          granular role-based policies in the supabase-auth migration step
--          when Supabase Auth is integrated.
-- Count:   16 ALTER TABLE statements + 16 CREATE POLICY statements
-- =============================================================================

-- ---- Core Tables (8) ----

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on roles" ON roles
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on templates" ON templates
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE profile_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on profile_templates" ON profile_templates
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE onboarding_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on onboarding_instances" ON onboarding_instances
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on suggestions" ON suggestions
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on activities" ON activities
  FOR ALL USING (true) WITH CHECK (true);

-- ---- Step Child Tables (3) ----

ALTER TABLE template_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on template_steps" ON template_steps
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE instance_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on instance_steps" ON instance_steps
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE profile_template_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on profile_template_steps" ON profile_template_steps
  FOR ALL USING (true) WITH CHECK (true);

-- ---- Junction Tables (5) ----

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on user_roles" ON user_roles
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE profile_role_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on profile_role_tags" ON profile_role_tags
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE instance_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on instance_profiles" ON instance_profiles
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE instance_template_refs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on instance_template_refs" ON instance_template_refs
  FOR ALL USING (true) WITH CHECK (true);
