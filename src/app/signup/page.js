'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

// Reusing styles from LoginPage for consistency
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background-color: ${({ theme }) => theme.background};
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
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const GoogleButton = styled(Button)`
  background: #db4437;
`;

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // You can add additional user meta-data here if needed
        // data: { full_name: '...' }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Success! Setting up your account...');
      // Wait for 2 seconds to let the Supabase trigger complete
      setTimeout(() => {
        router.push('/onboarding');
      }, 2000);
    }
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <Container>
      <h1>Create Account</h1>
      <p>Start your journey with jour-un.</p>
      <Form onSubmit={handleSignup}>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
        <Button type="submit">Sign Up</Button>
      </Form>
      <p>or</p>
      <GoogleButton onClick={handleGoogleSignup}>Sign up with Google</GoogleButton>
      <p style={{ marginTop: '1rem' }}>
        Already have an account? <a href="/login">Log In</a>
      </p>
    </Container>
  );
}