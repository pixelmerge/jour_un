'use client';
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${({ theme }) => theme.text.primary};
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.border.primary};
  border-radius: 8px;
  background: ${({ theme }) => theme.background.secondary};
  color: ${({ theme }) => theme.text.primary};
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.border.primary};
  border-radius: 8px;
  background: ${({ theme }) => theme.background.secondary};
  color: ${({ theme }) => theme.text.primary};
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.primaryButton.background};
  color: ${({ theme }) => theme.primaryButton.text};
  font-weight: 500;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.error};
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.success};
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

export function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    weight_kg: '',
    height_cm: '',
    age: '',
    gender: '',
    activity_level: '',
    full_name: '',
    nutrition_goal: '',
    physical_goal: '',
    activity_goal: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // Fetch user_profiles data
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userProfileError) throw userProfileError;

      // Fetch profiles data
      const { data: generalProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setProfile({
        ...userProfile,
        full_name: generalProfile?.full_name || '',
        nutrition_goal: generalProfile?.nutrition_goal || '',
        physical_goal: generalProfile?.physical_goal || '',
        activity_goal: generalProfile?.activity_goal || ''
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Update user_profiles
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm,
          age: profile.age,
          gender: profile.gender,
          activity_level: profile.activity_level,
          updated_at: new Date().toISOString()
        });

      if (userProfileError) throw userProfileError;

      // Update profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          nutrition_goal: profile.nutrition_goal,
          physical_goal: profile.physical_goal,
          activity_goal: profile.activity_goal,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile changes');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Please sign in to view your profile.</div>;
  if (loading) return <div>Loading profile...</div>;

  return (
    <Form onSubmit={handleSubmit}>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <FormSection>
        <Label>Full Name</Label>
        <Input
          type="text"
          value={profile.full_name}
          onChange={e => setProfile({ ...profile, full_name: e.target.value })}
          placeholder="Your full name"
        />
      </FormSection>

      <FormSection>
        <Label>Physical Characteristics</Label>
        <Input
          type="number"
          value={profile.weight_kg}
          onChange={e => setProfile({ ...profile, weight_kg: e.target.value })}
          placeholder="Weight (kg)"
        />
        <Input
          type="number"
          value={profile.height_cm}
          onChange={e => setProfile({ ...profile, height_cm: e.target.value })}
          placeholder="Height (cm)"
        />
        <Input
          type="number"
          value={profile.age}
          onChange={e => setProfile({ ...profile, age: e.target.value })}
          placeholder="Age"
        />
      </FormSection>

      <FormSection>
        <Label>Gender</Label>
        <Select
          value={profile.gender}
          onChange={e => setProfile({ ...profile, gender: e.target.value })}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
      </FormSection>

      <FormSection>
        <Label>Activity Level</Label>
        <Select
          value={profile.activity_level}
          onChange={e => setProfile({ ...profile, activity_level: e.target.value })}
        >
          <option value="">Select Activity Level</option>
          <option value="sedentary">Sedentary</option>
          <option value="light">Lightly Active</option>
          <option value="moderate">Moderately Active</option>
          <option value="active">Active</option>
          <option value="very_active">Very Active</option>
        </Select>
      </FormSection>

      <FormSection>
        <Label>Goals</Label>
        <Input
          type="text"
          value={profile.nutrition_goal}
          onChange={e => setProfile({ ...profile, nutrition_goal: e.target.value })}
          placeholder="Nutrition Goal"
        />
        <Input
          type="text"
          value={profile.physical_goal}
          onChange={e => setProfile({ ...profile, physical_goal: e.target.value })}
          placeholder="Physical Goal"
        />
        <Input
          type="text"
          value={profile.activity_goal}
          onChange={e => setProfile({ ...profile, activity_goal: e.target.value })}
          placeholder="Activity Goal"
        />
      </FormSection>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Profile'}
      </Button>
    </Form>
  );
}