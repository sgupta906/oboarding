/**
 * Supabase Database Type Definitions for OnboardingHub
 *
 * This file defines the TypeScript types for all 16 Postgres tables in the
 * Supabase database schema. It follows the same structure as the output of
 * `supabase gen types typescript` so that it can be regenerated from a live
 * database in the future.
 *
 * Type variants:
 *   Row    - A fully-loaded database row (all columns present)
 *   Insert - For INSERT operations (columns with defaults are optional)
 *   Update - For UPDATE operations (all columns are optional / partial)
 *
 * To regenerate from a running Supabase instance:
 *   npx supabase gen types typescript --local > src/types/database.types.ts
 *
 * Relationship to SQL migrations:
 *   supabase/migrations/00001_create_core_tables.sql     - 8 core tables
 *   supabase/migrations/00002_create_step_tables.sql     - 3 step child tables
 *   supabase/migrations/00003_create_junction_tables.sql - 5 junction tables
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ================================================================
      // Core Tables (8) - from 00001_create_core_tables.sql
      // ================================================================

      /** System users (employees, managers, admins). Firestore equivalent: 'users' collection. */
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };

      /** Custom role definitions. Firestore equivalent: 'roles' collection. */
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };

      /** Department/role profiles. Firestore equivalent: 'profiles' collection. */
      profiles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };

      /** Onboarding templates. Firestore equivalent: 'templates' collection. */
      templates: {
        Row: {
          id: string;
          name: string;
          description: string;
          role: string;
          is_active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          role: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      /** Profile-specific templates. Firestore equivalent: 'profileTemplates' collection. */
      profile_templates: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          description: string | null;
          version: number;
          is_published: boolean;
          created_at: string;
          updated_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          description?: string | null;
          version?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          description?: string | null;
          version?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };

      /** Active onboarding runs. Firestore equivalent: 'onboarding_instances' collection. */
      onboarding_instances: {
        Row: {
          id: string;
          employee_name: string;
          employee_email: string;
          role: string;
          department: string;
          template_id: string | null;
          progress: number;
          status: string;
          created_at: string;
          start_date: string | null;
          completed_at: string | null;
          template_snapshots: Json | null;
        };
        Insert: {
          id?: string;
          employee_name: string;
          employee_email: string;
          role: string;
          department: string;
          template_id?: string | null;
          progress?: number;
          status?: string;
          created_at?: string;
          start_date?: string | null;
          completed_at?: string | null;
          template_snapshots?: Json | null;
        };
        Update: {
          id?: string;
          employee_name?: string;
          employee_email?: string;
          role?: string;
          department?: string;
          template_id?: string | null;
          progress?: number;
          status?: string;
          created_at?: string;
          start_date?: string | null;
          completed_at?: string | null;
          template_snapshots?: Json | null;
        };
        Relationships: [];
      };

      /** Step feedback/suggestions. Firestore equivalent: 'suggestions' collection. */
      suggestions: {
        Row: {
          id: string;
          step_id: number;
          user_name: string;
          text: string;
          status: string;
          created_at: string | null;
          instance_id: string | null;
        };
        Insert: {
          id?: string;
          step_id: number;
          user_name: string;
          text: string;
          status?: string;
          created_at?: string | null;
          instance_id?: string | null;
        };
        Update: {
          id?: string;
          step_id?: number;
          user_name?: string;
          text?: string;
          status?: string;
          created_at?: string | null;
          instance_id?: string | null;
        };
        Relationships: [];
      };

      /** Audit trail. Firestore equivalent: 'activities' collection. */
      activities: {
        Row: {
          id: string;
          user_initials: string;
          action: string;
          time_ago: string | null;
          timestamp: string | null;
          user_id: string | null;
          resource_type: string | null;
          resource_id: string | null;
        };
        Insert: {
          id?: string;
          user_initials: string;
          action: string;
          time_ago?: string | null;
          timestamp?: string | null;
          user_id?: string | null;
          resource_type?: string | null;
          resource_id?: string | null;
        };
        Update: {
          id?: string;
          user_initials?: string;
          action?: string;
          time_ago?: string | null;
          timestamp?: string | null;
          user_id?: string | null;
          resource_type?: string | null;
          resource_id?: string | null;
        };
        Relationships: [];
      };

      // ================================================================
      // Step Child Tables (3) - from 00002_create_step_tables.sql
      // ================================================================

      /** Steps belonging to a template. Firestore equivalent: Template.steps[] embedded array. */
      template_steps: {
        Row: {
          id: string;
          template_id: string;
          position: number;
          title: string;
          description: string;
          role: string;
          owner: string;
          expert: string;
          status: string;
          link: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          position: number;
          title: string;
          description?: string;
          role?: string;
          owner?: string;
          expert?: string;
          status?: string;
          link?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          position?: number;
          title?: string;
          description?: string;
          role?: string;
          owner?: string;
          expert?: string;
          status?: string;
          link?: string | null;
        };
        Relationships: [];
      };

      /** Steps belonging to an onboarding instance. Firestore equivalent: OnboardingInstance.steps[] embedded array. */
      instance_steps: {
        Row: {
          id: string;
          instance_id: string;
          position: number;
          title: string;
          description: string;
          role: string;
          owner: string;
          expert: string;
          status: string;
          link: string | null;
        };
        Insert: {
          id?: string;
          instance_id: string;
          position: number;
          title: string;
          description?: string;
          role?: string;
          owner?: string;
          expert?: string;
          status?: string;
          link?: string | null;
        };
        Update: {
          id?: string;
          instance_id?: string;
          position?: number;
          title?: string;
          description?: string;
          role?: string;
          owner?: string;
          expert?: string;
          status?: string;
          link?: string | null;
        };
        Relationships: [];
      };

      /** Steps belonging to a profile template. Firestore equivalent: ProfileTemplate.steps[] embedded array. */
      profile_template_steps: {
        Row: {
          id: string;
          profile_template_id: string;
          position: number;
          title: string;
          description: string;
          role: string;
          owner: string;
          expert: string;
          status: string;
          link: string | null;
        };
        Insert: {
          id?: string;
          profile_template_id: string;
          position: number;
          title: string;
          description?: string;
          role?: string;
          owner?: string;
          expert?: string;
          status?: string;
          link?: string | null;
        };
        Update: {
          id?: string;
          profile_template_id?: string;
          position?: number;
          title?: string;
          description?: string;
          role?: string;
          owner?: string;
          expert?: string;
          status?: string;
          link?: string | null;
        };
        Relationships: [];
      };

      // ================================================================
      // Junction Tables (5) - from 00003_create_junction_tables.sql
      // ================================================================

      /** User role assignments. Firestore equivalent: User.roles[] embedded array. */
      user_roles: {
        Row: {
          user_id: string;
          role_name: string;
        };
        Insert: {
          user_id: string;
          role_name: string;
        };
        Update: {
          user_id?: string;
          role_name?: string;
        };
        Relationships: [];
      };

      /** User profile assignments. Firestore equivalent: User.profiles[] embedded array. */
      user_profiles: {
        Row: {
          user_id: string;
          profile_name: string;
        };
        Insert: {
          user_id: string;
          profile_name: string;
        };
        Update: {
          user_id?: string;
          profile_name?: string;
        };
        Relationships: [];
      };

      /** Profile role tag assignments. Firestore equivalent: Profile.roleTags[] embedded array. */
      profile_role_tags: {
        Row: {
          profile_id: string;
          role_tag: string;
        };
        Insert: {
          profile_id: string;
          role_tag: string;
        };
        Update: {
          profile_id?: string;
          role_tag?: string;
        };
        Relationships: [];
      };

      /** Instance profile assignments. Firestore equivalent: OnboardingInstance.profileIds[] embedded array. */
      instance_profiles: {
        Row: {
          instance_id: string;
          profile_id: string;
        };
        Insert: {
          instance_id: string;
          profile_id: string;
        };
        Update: {
          instance_id?: string;
          profile_id?: string;
        };
        Relationships: [];
      };

      /** Instance template references. Firestore equivalent: OnboardingInstance.templateIds[] embedded array. */
      instance_template_refs: {
        Row: {
          instance_id: string;
          template_id: string;
        };
        Insert: {
          instance_id: string;
          template_id: string;
        };
        Update: {
          instance_id?: string;
          template_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
