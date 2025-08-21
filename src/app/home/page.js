'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';

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

  useEffect(() => {
    if (searchParams?.get('auth') === 'success') {
      console.log('Auth success detected, refreshing session...');
      refreshSession();
    }
  }, [searchParams, refreshSession]);

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to login...');
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
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