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
// Note: SQL DDL moved to supabase/setup.sql. This file should contain only TypeScript types.