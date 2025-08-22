export interface UserProfile {
  id: string
  username?: string
  full_name?: string
  email?: string
  avatar_url?: string
  weight_kg?: number
  height_cm?: number
  age?: number
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  weekly_activity_minutes?: number
  sleep_duration_hours?: number
  physical_goal?: string
  nutrition_goal?: string
  activity_goal?: string
  target_weight_change_kg?: number
  target_weeks?: number
  daily_calorie_target?: number
  activity_minutes_target?: number
  sleep_target_hours?: number
  onboarding_complete?: boolean
  ai_consent?: boolean
  created_at?: string
  updated_at?: string
}

export interface Profile {
  id: string
  full_name?: string
  nutrition_goal?: string
  physical_goal?: string
  activity_goal?: string
  updated_at?: string
}
// Note: SQL DDL moved to supabase/setup.sql. This file should contain only TypeScript types.