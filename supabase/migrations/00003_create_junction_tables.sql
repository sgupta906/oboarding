-- =============================================================================
-- Migration 00003: Create Junction Tables (5 tables)
-- =============================================================================
-- Purpose: Creates the 5 junction tables that replace embedded string[] arrays.
-- Tables:  user_roles, user_profiles, profile_role_tags,
--          instance_profiles, instance_template_refs
-- Note:    Text-based junctions (user_roles, user_profiles, profile_role_tags)
--          store name strings. ID-based junctions (instance_profiles,
--          instance_template_refs) use UUID foreign keys.
-- =============================================================================

-- 12. user_roles
-- Firestore equivalent: User.roles[] embedded array
-- Maps users to their assigned role names (e.g., 'manager', 'admin', 'employee')
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  PRIMARY KEY (user_id, role_name)
);

-- 13. user_profiles
-- Firestore equivalent: User.profiles[] embedded array
-- Maps users to their assigned profile names (e.g., 'Engineering', 'Sales')
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  PRIMARY KEY (user_id, profile_name)
);

-- 14. profile_role_tags
-- Firestore equivalent: Profile.roleTags[] embedded array
-- Maps profiles to their associated role tag strings
CREATE TABLE IF NOT EXISTS profile_role_tags (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_tag TEXT NOT NULL,
  PRIMARY KEY (profile_id, role_tag)
);

-- 15. instance_profiles
-- Firestore equivalent: OnboardingInstance.profileIds[] embedded array
-- Maps onboarding instances to their assigned profiles
CREATE TABLE IF NOT EXISTS instance_profiles (
  instance_id UUID NOT NULL REFERENCES onboarding_instances(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (instance_id, profile_id)
);

-- 16. instance_template_refs
-- Firestore equivalent: OnboardingInstance.templateIds[] embedded array
-- Maps onboarding instances to the profile templates used (audit trail)
CREATE TABLE IF NOT EXISTS instance_template_refs (
  instance_id UUID NOT NULL REFERENCES onboarding_instances(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES profile_templates(id) ON DELETE CASCADE,
  PRIMARY KEY (instance_id, template_id)
);
