'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeProvider';
import Image from 'next/image';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Dynamically import Dashboard to avoid SSR issues
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });

const PageContainer = styled.div`
  margin-top: 0; /* remove extra space under nav */
  min-height: 100vh;
  padding: 1rem;
  background: ${props => props.theme.background};

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 60px);
  background: ${props => props.theme.background};
`;

const Header = styled.header`
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.background.secondary};
`;

const ThemeToggle = styled.button`
  padding: 0.5rem;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.border.primary};
  background: ${({ theme }) => theme.card.background};
  color: ${({ theme }) => theme.text.primary};
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.card.hover}; }
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: none;
  border: 1px solid ${({ theme }) => theme.border.primary};
  border-radius: 6px;
  color: ${({ theme }) => theme.text.primary};
  cursor: pointer;
`;

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check onboarding status and redirect accordingly
  useEffect(() => {
    async function checkUserStatus() {
      if (loading) return; // Wait for auth to load
      
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Check if user profile exists and if onboarding is complete
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('onboarding_complete, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          // If profile doesn't exist, redirect to onboarding
          if (error.code === 'PGRST116') {
            console.log('No user profile found, redirecting to onboarding');
            router.push('/onboarding');
            return;
          }
        } else if (profile) {
          // Set avatar from profile data
          setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
          
          // Check onboarding status
          if (!profile.onboarding_complete) {
            console.log('Onboarding not complete, redirecting...');
            router.push('/onboarding');
            return;
          }
        }
      } catch (err) {
        console.error('Error checking user status:', err);
        // On error, redirect to onboarding to be safe
        router.push('/onboarding');
        return;
      }

      setCheckingOnboarding(false);
    }

    checkUserStatus();
  }, [user, loading, router]);

  // Loading state
  if (loading || checkingOnboarding) {
    return (
      <LoadingContainer>
        <div>Loading...</div>
      </LoadingContainer>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      <Header>
        <h1>jour-un</h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '🌘' : '🌞'}
          </ThemeToggle>

          {user ? (
            <Link href="/profile">
              <ProfileButton>
                <Image 
                  src={
                    (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('http'))
                      ? avatarUrl
                      : '/icons/icon-192x192.png'
                  }
                  alt="Profile"
                  width={32}
                  height={32}
                  unoptimized
                  style={{ borderRadius: '50%', objectFit: 'cover', background: '#eee' }}
                />
              </ProfileButton>
            </Link>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </Header>
      <PageContainer>
        <Dashboard />
      </PageContainer>
    </>
  );
}