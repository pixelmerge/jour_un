import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const supabase = getSupabase()
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error

        setProfile(data)
        setError(null)
      } catch (err) {
        console.error('Error loading profile:', err)
        setError(err)
        
        // If profile doesn't exist, create it
        if (err.code === '406') {
          try {
            const supabase = getSupabase()
            const { data, error: insertError } = await supabase
              .from('user_profiles')
              .insert([{ id: userId }])
              .select()
              .single()

            if (insertError) throw insertError
            setProfile(data)
            setError(null)
          } catch (insertErr) {
            console.error('Error creating profile:', insertErr)
            setError(insertErr)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  return { profile, loading, error }
}