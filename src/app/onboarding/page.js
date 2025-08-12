'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { z } from 'zod';

const Container = styled.div`
  padding: 2rem;
  max-width: 600px;
  margin: auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  min-height: 80px;
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: white;
  font-weight: bold;
  cursor: pointer;
  align-self: flex-start;
`;

const goalSchema = z.object({
  physical_goal: z.string().min(10, 'Please describe your goal in more detail.'),
  nutrition_goal: z.string().min(10, 'Please describe your goal in more detail.'),
  activity_goal: z.string().min(10, 'Please describe your goal in more detail.'),
});

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState({
    physical_goal: '',
    nutrition_goal: '',
    activity_goal: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGoals(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const result = goalSchema.safeParse(goals);
    if (!result.success) {
      const errors = {};
      result.error.issues.forEach(issue => {
        errors[issue.path[0]] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update(result.data)
      .eq('id', user.id);

    if (error) {
      setFormErrors({ form: 'Could not save your goals. Please try again.' });
    } else {
      alert('Goals saved! Welcome to jour-un.');
      router.push('/'); // Redirect to dashboard
    }
  };
  
  if (loading || !user) return <p>Loading...</p>;

  return (
    <Container>
  <h1>Welcome! Let&apos;s Set Your Goals.</h1>
      <p>Defining your goals is the first step to success. Be specific!</p>
      <Form onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="physical_goal">Physical Goal</Label>
          <TextArea 
            id="physical_goal" 
            name="physical_goal" 
            value={goals.physical_goal} 
            onChange={handleChange}
            placeholder="e.g., Lose 5kg in 3 months by improving my stamina."
          />
          {formErrors.physical_goal && <p style={{ color: 'red' }}>{formErrors.physical_goal}</p>}
        </div>
        <div>
          <Label htmlFor="nutrition_goal">Nutrition Goal</Label>
          <TextArea 
            id="nutrition_goal" 
            name="nutrition_goal" 
            value={goals.nutrition_goal} 
            onChange={handleChange}
            placeholder="e.g., Eat at least 5 servings of vegetables daily and reduce sugar intake."
          />
          {formErrors.nutrition_goal && <p style={{ color: 'red' }}>{formErrors.nutrition_goal}</p>}
        </div>
        <div>
          <Label htmlFor="activity_goal">Lifestyle & Activity Goal</Label>
          <TextArea 
            id="activity_goal" 
            name="activity_goal" 
            value={goals.activity_goal} 
            onChange={handleChange}
            placeholder="e.g., Go to the gym 3 times a week and get at least 7 hours of sleep per night."
          />
          {formErrors.activity_goal && <p style={{ color: 'red' }}>{formErrors.activity_goal}</p>}
        </div>
        {formErrors.form && <p style={{ color: 'red' }}>{formErrors.form}</p>}
        <Button type="submit">Save Goals & Start</Button>
      </Form>
    </Container>
  );
}   