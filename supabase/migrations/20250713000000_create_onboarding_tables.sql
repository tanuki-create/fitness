-- Create profiles table to store user data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  weight DOUBLE PRECISION,
  height DOUBLE PRECISION,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goals table
CREATE TABLE goals (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  target_value DOUBLE PRECISION NOT NULL,
  target_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create plans table
CREATE TABLE plans (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id BIGINT REFERENCES goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  frequency TEXT,
  description TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create plan_workouts table
CREATE TABLE plan_workouts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_of_week TEXT,
  focus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile." ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for goals
CREATE POLICY "Users can manage their own goals." ON goals
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for plans
CREATE POLICY "Users can manage their own plans." ON plans
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for plan_workouts
CREATE POLICY "Users can view workouts for their own plans." ON plan_workouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plans WHERE plans.id = plan_workouts.plan_id AND plans.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert workouts for their own plans." ON plan_workouts
  FOR INSERT to authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM plans WHERE plans.id = plan_workouts.plan_id AND plans.user_id = auth.uid()
    )
  ); 