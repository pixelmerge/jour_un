import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    }

    if (sessionData?.user) {
      const user = sessionData.user;
      
      try {
        // Check if user profile exists
        const { data: userProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.log('User profile not found, creating new profile...');
          
          // Create a new user profile
          const { error: createError } = await supabase.from('user_profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            onboarding_complete: false,
            ai_consent: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          if (createError) {
            console.error('Error creating user profile:', createError);
          }

          // Always redirect new users to onboarding
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
        }

        // If profile exists but onboarding not complete
        if (!userProfile.onboarding_complete) {
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
        }

        // Profile exists and onboarding complete - go to main app
        return NextResponse.redirect(`${requestUrl.origin}/`);
        
      } catch (error) {
        console.error('Error in auth callback:', error);
        // On error, redirect to onboarding to be safe
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
      }
    }
  }

  // Default redirect if no code or session
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}