'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navigation } from '@/components/Navigation';
import styled from '@emotion/styled';

// Dynamically import Dashboard to avoid SSR issues
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });

const PageContainer = styled.div`
  margin-top: 60px; // Height of the navigation bar
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
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <>
        <Navigation />
        <LoadingContainer>
          <div>Loading...</div>
        </LoadingContainer>
      </>
    );
  }
  
  if (!user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <PageContainer>
        <Dashboard />
      </PageContainer>
    </>
  );
}