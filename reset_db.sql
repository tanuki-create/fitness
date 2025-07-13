-- =================================================================
-- Complete Database Reset Script for Fitness AI (MVP v1)
--
-- This script will:
-- 1. Drop all existing tables and types to ensure a clean slate.
-- 2. Re-create all tables with the latest schema.
-- 3. Configure tables for MVP v1 (anonymous access):
--    - Make `user_id` nullable (already handled in CREATE TABLE).
--    - Apply open Row Level Security (RLS) policies.
-- 4. Enable Supabase Realtime for specified tables.
-- =================================================================

-- Step 1: Drop existing objects to ensure a clean slate
DROP TABLE IF EXISTS public.training_plans CASCADE;
DROP TABLE IF EXISTS public.advices CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.workout_logs CASCADE;
DROP TABLE IF EXISTS public.body_metrics CASCADE;
DROP TYPE IF EXISTS public.goal_type;

-- Step 2: Create custom types
CREATE TYPE public.goal_type AS ENUM ('lose_weight', 'maintain', 'gain_muscle', 'reduce_fat');

-- Step 3: Create tables
-- Table: body_metrics
CREATE TABLE public.body_metrics (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at  timestamptz NOT NULL DEFAULT now(),
  weight       numeric(5,2) CHECK (weight > 0),
  body_fat     numeric(4,1) CHECK (body_fat BETWEEN 1 AND 80),
  photo_url    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.body_metrics IS 'Stores body composition data like weight and body fat percentage.';

-- Table: workout_logs
CREATE TABLE public.workout_logs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise     text NOT NULL,
  reps         int NOT NULL CHECK (reps > 0),
  sets         int NOT NULL CHECK (sets > 0),
  volume       numeric(8,2),
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.workout_logs IS 'Logs for individual workout sessions.';

-- Table: goals
CREATE TABLE public.goals (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type         goal_type NOT NULL,
  target_value numeric(5,2) NOT NULL,
  target_date  date NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  is_active    boolean NOT NULL DEFAULT true
);
COMMENT ON TABLE public.goals IS 'User-defined fitness goals.';

-- Table: training_plans
CREATE TABLE public.training_plans (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id         uuid REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  frequency_per_week int CHECK (frequency_per_week BETWEEN 1 AND 7),
  is_selected     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.training_plans IS 'AI-generated training plans tailored to a user''s goal.';

-- Table: advices
CREATE TABLE public.advices (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_log_id   uuid REFERENCES public.workout_logs(id) ON DELETE SET NULL,
  body_metric_id   uuid REFERENCES public.body_metrics(id) ON DELETE SET NULL,
  content          text NOT NULL,
  is_read          boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.advices IS 'AI-generated feedback and advice.';

-- Step 4: Create Indexes for performance
CREATE INDEX ON public.body_metrics(user_id, measured_at DESC);
CREATE INDEX ON public.workout_logs(user_id, performed_at DESC);
CREATE INDEX ON public.goals(user_id, is_active);
CREATE INDEX ON public.training_plans(goal_id);
CREATE INDEX ON public.training_plans(user_id, is_selected);
CREATE INDEX ON public.advices(user_id, created_at DESC);

-- Step 5: Configure for MVP (Anonymous Access)
-- Enable Row Level Security on all tables
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advices ENABLE ROW LEVEL SECURITY;

-- Apply open policies for anonymous access in v1
CREATE POLICY "Enable ALL for anonymous users" ON public.body_metrics FOR ALL USING (true);
CREATE POLICY "Enable ALL for anonymous users" ON public.workout_logs FOR ALL USING (true);
CREATE POLICY "Enable ALL for anonymous users" ON public.goals FOR ALL USING (true);
CREATE POLICY "Enable ALL for anonymous users" ON public.training_plans FOR ALL USING (true);
CREATE POLICY "Enable ALL for anonymous users" ON public.advices FOR ALL USING (true);

-- Step 6: Enable Supabase Realtime on workout_logs
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE workout_logs; 