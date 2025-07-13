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

-- Create Indexes for performance
CREATE INDEX ON public.body_metrics(user_id, measured_at DESC);
CREATE INDEX ON public.workout_logs(user_id, performed_at DESC);
CREATE INDEX ON public.advices(user_id, created_at DESC);

-- Enable Row Level Security on all tables
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advices ENABLE ROW LEVEL SECURITY;

-- Apply open policies for anonymous access in v1
CREATE POLICY "Enable ALL for anonymous users" ON public.body_metrics FOR ALL USING (true);
CREATE POLICY "Enable ALL for anonymous users" ON public.workout_logs FOR ALL USING (true);
CREATE POLICY "Enable ALL for anonymous users" ON public.advices FOR ALL USING (true); 