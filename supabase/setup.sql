-- Drop existing objects first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS food_entries;
DROP TABLE IF EXISTS sleep_entries;
DROP TABLE IF EXISTS activity_entries;
DROP TABLE IF EXISTS user_profiles;  -- Add this line
DROP TABLE IF EXISTS profiles;

-- Create user_profiles table for physical attributes
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    weight_kg NUMERIC,
    height_cm NUMERIC,
    age INTEGER,
    gender TEXT,
    activity_level TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT weight_check CHECK (weight_kg > 0),
    CONSTRAINT height_check CHECK (height_cm > 0),
    CONSTRAINT age_check CHECK (age > 0)
);

-- Modify profiles table to include both profile types
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    physical_goal TEXT,
    nutrition_goal TEXT,
    activity_goal TEXT,
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Update handle_new_user function to create both profile entries
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    
    INSERT INTO public.user_profiles (id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create Food Entries table
CREATE TABLE food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER,
  portion_size TEXT,
  notes TEXT,
  image_url TEXT,
  nutrition JSONB DEFAULT '{}'::jsonb
);

-- Create Sleep Entries table
CREATE TABLE sleep_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_hours DECIMAL(4, 2), -- e.g., 7.50 hours
  quality TEXT
);

-- Create Activity Entries table
CREATE TABLE activity_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  description TEXT,
  calories_burned INTEGER,
  duration_minutes INTEGER,
  activity_type TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can manage their own profile.
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own profile." ON profiles FOR SELECT USING (auth.uid() = id);

-- Users can manage their own entries.
CREATE POLICY "Users can manage their own food entries." ON food_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sleep entries." ON sleep_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own activity entries." ON activity_entries FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own user profile.
CREATE POLICY "Users can insert their own user profile." 
    ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
    
CREATE POLICY "Users can update their own user profile." 
    ON user_profiles FOR UPDATE USING (auth.uid() = id);
    
CREATE POLICY "Users can view their own user profile." 
    ON user_profiles FOR SELECT USING (auth.uid() = id);

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can manage their own sleep entries" ON sleep_entries;

-- Create new RLS policy for sleep entries
CREATE POLICY "Users can manage their own sleep entries" ON sleep_entries 
FOR ALL USING (
    auth.uid() = user_id
) WITH CHECK (
    auth.uid() = user_id
);

-- Handle storage setup with proper checks
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can upload food images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their own food images" ON storage.objects;
    
    -- Create storage bucket if it doesn't exist
    IF NOT EXISTS (SELECT FROM storage.buckets WHERE id = 'food_images') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('food_images', 'food_images', false);
    END IF;
    
    -- Create new policies
    CREATE POLICY "Users can upload food images" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'food_images' 
            AND auth.uid()::text = owner_id
        );

    CREATE POLICY "Users can view their own food images" ON storage.objects
        FOR SELECT USING (
            bucket_id = 'food_images' 
            AND auth.uid()::text = owner_id
        );
END $$;
