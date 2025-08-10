export interface UserProfile {
  id: string
  weight_kg: number
  height_cm: number
  age: number
  gender: string
  activity_level: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string
  nutrition_goal: string
  physical_goal: string
  activity_goal: string
  updated_at: string
}

-- user_profiles table
create table user_profiles (
  id uuid references auth.users primary key,
  weight_kg numeric,
  height_cm numeric,
  age integer,
  gender text,
  activity_level text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- profiles table
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  nutrition_goal text,
  physical_goal text,
  activity_goal text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS and add policies
alter table user_profiles enable row level security;
alter table profiles enable row level security;

create policy "Users can read own profile"
  on user_profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on user_profiles for update
  using ( auth.uid() = id );

-- Similar policies for profiles table
create policy "Users can read own general profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own general profile"
  on profiles for update
  using ( auth.uid() = id );