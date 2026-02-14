-- =============================================================================
-- Migration 00001: Create Core Tables (8 tables)
-- =============================================================================
-- Purpose: Creates the 8 primary tables that map to Firestore collections.
-- Tables:  users, roles, profiles, templates, profile_templates,
--          onboarding_instances, suggestions, activities
-- Order:   Respects foreign key dependencies (parents before children).
-- =============================================================================

-- 1. users
-- Firestore equivalent: 'users' collection (merged with FirestoreUser auth data)
-- System users: employees, managers, admins
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT users_email_unique UNIQUE (lower(email))
);

-- 2. roles
-- Firestore equivalent: 'roles' collection
-- Custom role definitions (e.g., Engineering, Sales, HR)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT roles_name_unique UNIQUE (lower(name))
);

-- 3. profiles
-- Firestore equivalent: 'profiles' collection
-- Department/role profiles (e.g., Engineer, Intern, Sales, Product)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 4. templates
-- Firestore equivalent: 'templates' collection
-- Onboarding templates (steps are stored in the template_steps child table)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. profile_templates
-- Firestore equivalent: 'profileTemplates' collection
-- Profile-specific templates (steps are stored in the profile_template_steps child table)
CREATE TABLE IF NOT EXISTS profile_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 6. onboarding_instances
-- Firestore equivalent: 'onboarding_instances' collection
-- Active onboarding runs (steps are stored in the instance_steps child table)
CREATE TABLE IF NOT EXISTS onboarding_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  template_snapshots JSONB
);

-- 7. suggestions
-- Firestore equivalent: 'suggestions' collection
-- Step feedback/suggestions from employees
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented')),
  created_at TIMESTAMPTZ DEFAULT now(),
  instance_id UUID REFERENCES onboarding_instances(id) ON DELETE SET NULL
);

-- 8. activities
-- Firestore equivalent: 'activities' collection
-- Audit trail entries for manager dashboard
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_initials TEXT NOT NULL,
  action TEXT NOT NULL,
  time_ago TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resource_type TEXT,
  resource_id TEXT
);
