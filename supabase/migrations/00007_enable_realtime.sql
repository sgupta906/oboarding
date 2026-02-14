-- =============================================================================
-- Migration 00007: Enable Realtime (16 tables)
-- =============================================================================
-- Purpose: Adds all 16 tables to the supabase_realtime publication so that
--          postgres_changes events fire for Supabase Realtime subscriptions.
-- Tables:  users, roles, profiles, templates, profile_templates,
--          onboarding_instances, suggestions, activities,
--          template_steps, instance_steps, profile_template_steps,
--          user_roles, user_profiles, profile_role_tags,
--          instance_profiles, instance_template_refs
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE
  users,
  roles,
  profiles,
  templates,
  profile_templates,
  onboarding_instances,
  suggestions,
  activities,
  template_steps,
  instance_steps,
  profile_template_steps,
  user_roles,
  user_profiles,
  profile_role_tags,
  instance_profiles,
  instance_template_refs;
