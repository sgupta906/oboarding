-- =============================================================================
-- Migration 00004: Create Performance Indexes (13 indexes)
-- =============================================================================
-- Purpose: Creates indexes for common query patterns identified from the
--          existing dataClient.ts access patterns.
-- Count:   13 indexes across 8 tables
-- =============================================================================

-- onboarding_instances: query by employee email (case-insensitive), template, status
CREATE INDEX IF NOT EXISTS idx_onboarding_instances_employee_email ON onboarding_instances (lower(employee_email));
CREATE INDEX IF NOT EXISTS idx_onboarding_instances_template_id ON onboarding_instances (template_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_instances_status ON onboarding_instances (status);

-- suggestions: query by instance
CREATE INDEX IF NOT EXISTS idx_suggestions_instance_id ON suggestions (instance_id);

-- activities: query by timestamp (recent first), by user
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities (user_id);

-- template_steps: query by parent template
CREATE INDEX IF NOT EXISTS idx_template_steps_template_id ON template_steps (template_id);

-- instance_steps: query by parent instance, filter by status
CREATE INDEX IF NOT EXISTS idx_instance_steps_instance_id ON instance_steps (instance_id);
CREATE INDEX IF NOT EXISTS idx_instance_steps_status ON instance_steps (status);

-- profile_templates: query by parent profile
CREATE INDEX IF NOT EXISTS idx_profile_templates_profile_id ON profile_templates (profile_id);

-- profile_template_steps: query by parent profile template
CREATE INDEX IF NOT EXISTS idx_profile_template_steps_template_id ON profile_template_steps (profile_template_id);

-- user_roles / user_profiles: query by user
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);
