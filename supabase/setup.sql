-- =====================================================
-- JOUR-UN: Complete Database Schema Setup
-- =====================================================
-- This script creates all necessary tables for the jour-un application
-- Run this in the Supabase SQL Editor

-- =====================================================
-- 1. USER PROFILES TABLE (Unified profile + onboarding)
-- =====================================================
-- Ensure gen_random_uuid() is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Basic profile info
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Physical characteristics for activity calculations
  weight_kg NUMERIC CHECK (weight_kg > 0),
  height_cm NUMERIC CHECK (height_cm > 0),
  age INTEGER CHECK (age > 0),
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  
  -- Activity and health data
  weekly_activity_minutes INTEGER,
  sleep_duration_hours NUMERIC,
  
  -- Goals
  physical_goal TEXT,
  nutrition_goal TEXT,
  activity_goal TEXT DEFAULT 'moderately_active',
  
  -- Targets (derived from goals and physical characteristics)
  target_weight_change_kg NUMERIC,
  target_weeks INTEGER,
  daily_calorie_target INTEGER,
  activity_minutes_target INTEGER DEFAULT 210,
  sleep_target_hours NUMERIC DEFAULT 8.0,
  
  -- Onboarding and consent
  onboarding_complete BOOLEAN DEFAULT FALSE,
  -- ai_consent: NULL = not set, true = opted in, false = opted out
  ai_consent BOOLEAN DEFAULT NULL,
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- =====================================================
-- 2. FOOD ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  food_name TEXT NOT NULL,
  calories INTEGER,
  portion_size TEXT,
  notes TEXT,
  image_url TEXT
);

-- =====================================================
-- 3. SLEEP ENTRIES TABLE  
-- =====================================================
CREATE TABLE IF NOT EXISTS sleep_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_hours DECIMAL(4, 2),
  quality TEXT CHECK (quality IN ('Pending', 'Very Poor', 'Poor', 'Good', 'Oversleep')),
  is_complete BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- 4. ACTIVITY ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  activity_type TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  calories_burned INTEGER
);

-- =====================================================
-- 5. WEIGHT HISTORY TABLE (Optional tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  weight_kg NUMERIC CHECK (weight_kg > 0),
  weight_lb NUMERIC CHECK (weight_lb > 0),
  notes TEXT
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_complete 
ON user_profiles (onboarding_complete);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username 
ON user_profiles (username);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_created 
ON food_entries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sleep_entries_user_created 
ON sleep_entries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sleep_entries_user_end_time 
ON sleep_entries (user_id, end_time DESC);

CREATE INDEX IF NOT EXISTS idx_activity_entries_user_created 
ON activity_entries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weight_history_user_recorded 
ON weight_history (user_id, recorded_at DESC);

-- =====================================================
-- 7. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers to update updated_at timestamp
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_food_entries_updated_at
  BEFORE UPDATE ON food_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_sleep_entries_updated_at
  BEFORE UPDATE ON sleep_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_activity_entries_updated_at
  BEFORE UPDATE ON activity_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their own food entries" ON food_entries;
DROP POLICY IF EXISTS "Users can manage their own sleep entries" ON sleep_entries;
DROP POLICY IF EXISTS "Users can manage their own activity entries" ON activity_entries;
DROP POLICY IF EXISTS "Users can manage their own weight history" ON weight_history;

-- Also drop any old-style policies that might exist
DROP POLICY IF EXISTS "Users can insert their own profile." ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON user_profiles;

-- User Profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Food Entries policies
CREATE POLICY "Users can manage their own food entries" ON food_entries 
  FOR ALL USING (auth.uid() = user_id);

-- Sleep Entries policies  
CREATE POLICY "Users can manage their own sleep entries" ON sleep_entries 
  FOR ALL USING (auth.uid() = user_id);

-- Activity Entries policies
CREATE POLICY "Users can manage their own activity entries" ON activity_entries 
  FOR ALL USING (auth.uid() = user_id);

-- Weight History policies
CREATE POLICY "Users can manage their own weight history" ON weight_history 
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 9. STORAGE BUCKETS AND POLICIES
-- =====================================================

-- Create storage bucket for food images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'food_images', 
  'food_images', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  2097152, -- 2MB limit  
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload food images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own food images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own food images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own food images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Storage policies for food images
CREATE POLICY "Users can upload food images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'food_images' 
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own food images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'food_images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own food images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'food_images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own food images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'food_images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for avatars  
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- 10. HELPFUL VIEWS (Optional)
-- =====================================================

-- View for complete user profile with recent activity
CREATE OR REPLACE VIEW user_profile_summary AS
SELECT 
  up.*,
  (
    SELECT COUNT(*) 
    FROM food_entries fe 
    WHERE fe.user_id = up.id 
    AND fe.created_at >= CURRENT_DATE
  ) as today_food_entries,
  (
    SELECT COUNT(*) 
    FROM activity_entries ae 
    WHERE ae.user_id = up.id 
    AND ae.created_at >= CURRENT_DATE
  ) as today_activity_entries,
  (
    SELECT COUNT(*) 
    FROM sleep_entries se 
    WHERE se.user_id = up.id 
    AND se.created_at >= CURRENT_DATE
    AND se.is_complete = true
  ) as today_sleep_entries
FROM user_profiles up;

-- =====================================================
-- SETUP COMPLETE! 
-- =====================================================
-- 
-- Next steps:
-- 1. Run this entire script in your Supabase SQL Editor
-- 2. Verify all tables were created successfully  
-- 3. Test user registration to ensure triggers work
-- 4. Update your application code if needed
--
-- =====================================================

-- =====================================================
-- AI Consent Audit Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_consent_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  old_value boolean,
  new_value boolean,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_consent_audit_user_id ON ai_consent_audit(user_id);

-- =====================================================