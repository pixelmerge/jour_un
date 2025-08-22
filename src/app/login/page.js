'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
`;

const Button = styled.button`
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: white;
  font-weight: bold;
  cursor: pointer;
`;

const GoogleButton = styled(Button)`
  background: #db4437;
`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [oauthError, setOauthError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }
  };
  
  const handleGoogleLogin = async () => {
    setOauthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        setOauthError(error.message || 'Failed to start Google sign-in');
        return;
      }

      // Some SDK versions return a url to redirect to. If present, navigate there.
      if (data?.url) {
        window.location.href = data.url;
      }
      // Otherwise the SDK should have already redirected the browser.
    } catch (err) {
      console.error('Error starting Google sign-in:', err);
      setOauthError('Failed to start Google sign-in');
    }
  };

  return (
    <Container>
      <img 
        src="/icons/icon-512x512.png" 
        alt="jour-un logo" 
        style={{ width: '128px', height: '128px', marginBottom: '1rem' }}
      />
   
      <Form onSubmit={handleLogin}>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <Button type="submit">Log In</Button>
      </Form>
  <p>or</p>
  {oauthError && <p style={{ color: 'red' }}>{oauthError}</p>}
  <GoogleButton onClick={handleGoogleLogin}>Sign in with Google</GoogleButton>
  <p>Don&apos;t have an account? <a href="/signup">Sign Up</a></p>
    </Container>
  );
}