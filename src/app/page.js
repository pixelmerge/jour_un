'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthProvider'
import dynamic from 'next/dynamic'
import styled from '@emotion/styled'
import { Navigation } from '@/components/Navigation'

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
  loading: () => <div>Loading dashboard...</div>
})

const PageContainer = styled.div`
  margin-top: 60px;
  min-height: calc(100vh - 60px);
  padding: 1rem;
  background: ${props => props.theme.background};

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Navigation />
      <PageContainer>
        <Dashboard />
      </PageContainer>
    </>
  )
}