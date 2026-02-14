-- =============================================================================
-- Migration 00006: Create Triggers (1 function + 5 triggers)
-- =============================================================================
-- Purpose: Creates the update_updated_at() function and attaches it as a
--          BEFORE UPDATE trigger on the 5 tables that have an updated_at column.
-- Tables:  users, roles, templates, profile_templates, onboarding_instances
-- =============================================================================

-- Create or replace the shared trigger function.
-- Sets NEW.updated_at = now() on every UPDATE operation.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to each table with an updated_at column

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profile_templates_updated_at
  BEFORE UPDATE ON profile_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER onboarding_instances_updated_at
  BEFORE UPDATE ON onboarding_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
