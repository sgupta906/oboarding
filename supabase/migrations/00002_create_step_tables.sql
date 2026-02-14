-- =============================================================================
-- Migration 00002: Create Step Child Tables (3 tables)
-- =============================================================================
-- Purpose: Creates the 3 step child tables that replace embedded Step[] arrays.
-- Tables:  template_steps, instance_steps, profile_template_steps
-- Note:    All three share an identical column structure but have different
--          parent foreign keys and CASCADE behaviors.
-- =============================================================================

-- 9. template_steps
-- Firestore equivalent: Template.steps[] embedded array
-- Steps belonging to a template definition
CREATE TABLE IF NOT EXISTS template_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'All',
  owner TEXT NOT NULL DEFAULT '',
  expert TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'stuck')),
  link TEXT DEFAULT '',
  CONSTRAINT template_steps_unique_position UNIQUE (template_id, position)
);

-- 10. instance_steps
-- Firestore equivalent: OnboardingInstance.steps[] embedded array
-- Steps belonging to an active onboarding instance
CREATE TABLE IF NOT EXISTS instance_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES onboarding_instances(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'All',
  owner TEXT NOT NULL DEFAULT '',
  expert TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'stuck')),
  link TEXT DEFAULT '',
  CONSTRAINT instance_steps_unique_position UNIQUE (instance_id, position)
);

-- 11. profile_template_steps
-- Firestore equivalent: ProfileTemplate.steps[] embedded array
-- Steps belonging to a profile-specific template
CREATE TABLE IF NOT EXISTS profile_template_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_template_id UUID NOT NULL REFERENCES profile_templates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'All',
  owner TEXT NOT NULL DEFAULT '',
  expert TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'stuck')),
  link TEXT DEFAULT '',
  CONSTRAINT profile_template_steps_unique_position UNIQUE (profile_template_id, position)
);
