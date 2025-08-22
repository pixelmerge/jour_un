'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { supabase } from '@/lib/supabaseClient';

const Dashboard = dynamic(() => import('@/components/Dashboard'), { 
  ssr: false,
  loading: () => <div>Loading dashboard...</div>
});

const PageContainer = styled.div`
  margin-top: 60px;
  min-height: calc(100vh - 60px);
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

export default function HomePage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (searchParams?.get('auth') === 'success') {
      refreshSession();
    }
  }, [searchParams, refreshSession]);

  useEffect(() => {
    async function checkOnboarding() {
      if (!loading) {
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_complete')
            .eq('id', user.id)
            .single();
          if (!profile || profile.onboarding_complete !== true) {
            router.push('/onboarding');
            return;
          }
        } else {
          router.push('/login');
        }
      }
      setCheckingOnboarding(false);
    }
    checkOnboarding();
  }, [user, loading, router]);

  if (loading || checkingOnboarding) {
    return <LoadingContainer>Loading...</LoadingContainer>;
  }

  if (!user) {
    return null;
  }

  return (
    <PageContainer>
      <Dashboard />
    </PageContainer>
  );
}