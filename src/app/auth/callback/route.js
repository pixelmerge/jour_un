import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (code) {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Code exchange error:', error)
        throw error
      }

      if (!session) {
        console.error('No session after code exchange')
        throw new Error('No session created')
      }

      // Set cookie with session
      const response = NextResponse.redirect(new URL('/?auth=success', requestUrl.origin))
      
      // Set a cookie to indicate successful auth
      response.cookies.set('auth-success', 'true', {
        maxAge: 30, // 30 seconds
        path: '/',
      })

      return response
    }

    return NextResponse.redirect(new URL('/login', requestUrl.origin))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent(error.message), requestUrl.origin))
  }
}