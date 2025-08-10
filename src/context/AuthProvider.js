'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  const refreshSession = async () => {
    try {
      console.log('Refreshing session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Session refresh error:', error)
        throw error
      }
      console.log('Session state:', session ? 'Found' : 'Not found')
      if (session?.user) {
        console.log('Setting user state')
        setUser(session.user)
        if (pathname === '/login') {
          router.push('/')
        }
      } else {
        console.log('No session found')
        setUser(null)
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Error in refresh session:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('Initial session check...')
    refreshSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      if (session?.user) {
        console.log('User found in session')
        setUser(session.user)
        if (pathname === '/login') {
          router.push('/')
        }
      } else {
        console.log('No user in session')
        setUser(null)
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname])

  const value = {
    user,
    loading,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

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