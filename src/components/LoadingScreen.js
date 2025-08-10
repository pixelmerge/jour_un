'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeProvider';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: ${props => props.theme.background};
`;

export default function LoadingScreen() {
  const [animation, setAnimation] = useState(null);

  useEffect(() => {
    import('../../public/animations/splash.json')
      .then(module => {
        setAnimation(module.default);
      })
      .catch(err => {
        console.error('Error loading animation:', err);
      });
  }, []);

  if (!animation) {
    return (
      <LoadingContainer>
        <div>Loading...</div>
      </LoadingContainer>
    );
  }

  return (
    <LoadingContainer>
      <Lottie 
        animationData={animation} 
        loop={true} 
        style={{ width: 200, height: 200 }}
      />
    </LoadingContainer>
  );
}
