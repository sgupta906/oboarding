-- Migration 00009: Add user_name column to activities table
-- Stores the full display name for the Activity Feed (Bug #33).
-- Nullable for backward compatibility with existing rows.
ALTER TABLE activities ADD COLUMN user_name TEXT;
