import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        // Fetch both profile tables in parallel
        const [profileResult, userProfileResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single(),
          supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()
        ]);

        if (profileResult.error) throw profileResult.error;
        if (userProfileResult.error) throw userProfileResult.error;

        // Combine both profiles
        setProfile({
          ...profileResult.data,
          ...userProfileResult.data
        });
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadProfile();
    }
  }, [userId]);

  return { profile, loading, error };
}