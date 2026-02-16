-- =============================================================================
-- Migration 00008: Add updated_at column to onboarding_instances
-- =============================================================================
-- Purpose: The onboarding_instances table has a BEFORE UPDATE trigger
--          (onboarding_instances_updated_at) that sets NEW.updated_at = now(),
--          but the table was never given an updated_at column. This causes
--          PostgreSQL error 42703 ("record 'new' has no field 'updated_at'")
--          on every UPDATE, blocking step status persistence and instance
--          progress recalculation.
--
-- Fix:     Add the missing updated_at column and backfill existing rows.
-- =============================================================================

-- Add the missing column (metadata-only operation in PostgreSQL 11+)
ALTER TABLE onboarding_instances
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill existing rows: use completed_at if available, otherwise created_at
UPDATE onboarding_instances
  SET updated_at = COALESCE(completed_at, created_at, now());
