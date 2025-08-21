'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import Lottie from 'react-lottie';
import animationData from '../../../public/animations/onboarding.json';
import { z } from 'zod';

const Container = styled.div`
  padding: 2rem;
  max-width: 600px;
  margin: auto;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
`;

const Label = styled.label`
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: left;
  display: block;
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: white;
  font-weight: bold;
  cursor: pointer;
  align-self: center;
  margin-top: 1rem;
`;

const GoalCard = styled.div`
  background: ${({ theme }) => theme.cardBg};
  padding: 1.5rem;
  border-radius: 12px;
  margin-top: 1rem;
  text-align: left;
`;

const personalInfoSchema = z.object({
  height_cm: z.number().positive(),
  weight_kg: z.number().positive(),
  age: z.number().positive().int(),
  gender: z.enum(['male', 'female', 'other']),
  weekly_activity_minutes: z.number().positive().int(),
  sleep_duration_hours: z.number().positive(),
});

const goalSchema = z.object({
  physical_goal: z.enum(['lose_weight', 'gain_weight', 'build_muscle']),
});

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    height_cm: '',
    weight_kg: '',
    age: '',
    gender: 'male',
    weekly_activity_minutes: '',
    sleep_duration_hours: '',
    physical_goal: 'lose_weight',
  });
  const [suggestedGoals, setSuggestedGoals] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    setFormErrors({});
    const dataToValidate = {
      ...formData,
      height_cm: parseFloat(formData.height_cm),
      weight_kg: parseFloat(formData.weight_kg),
      age: parseInt(formData.age),
      weekly_activity_minutes: parseInt(formData.weekly_activity_minutes),
      sleep_duration_hours: parseFloat(formData.sleep_duration_hours),
    };

    const result = personalInfoSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errors = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0]] = issue.message;
      });
      setFormErrors(errors);
      return;
    }
    setStep(2);
  };

  const handleGeneratePlan = async () => {
    setFormErrors({});
    const result = goalSchema.safeParse(formData);
    if (!result.success) {
        const errors = {};
        result.error.issues.forEach((issue) => {
          errors[issue.path[0]] = issue.message;
        });
        setFormErrors(errors);
        return;
      }

    setIsGenerating(true);
    setStep(3);

    try {
      const response = await fetch('/api/generate-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height: formData.height_cm,
          weight: formData.weight_kg,
          age: formData.age,
          gender: formData.gender,
          activity: formData.weekly_activity_minutes,
          sleep: formData.sleep_duration_hours,
          goal: formData.physical_goal,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate plan.');

      const data = await response.json();
      setSuggestedGoals(data);
      setStep(4);
    } catch (error) {
      setFormErrors({ form: error.message });
      setStep(2); // Go back to the goal selection
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGoals = async () => {
    const finalData = {
      ...formData,
      nutrition_goal_calories: suggestedGoals.calories,
      activity_goal_minutes: suggestedGoals.activity,
      sleep_goal_hours: suggestedGoals.sleep,
    };

    const { error } = await supabase
      .from('profiles')
      .update(finalData)
      .eq('id', user.id);

    if (error) {
      setFormErrors({ form: 'Could not save your profile. Please try again.' });
    } else {
      alert('Profile saved! Welcome to jour-un.');
      router.push('/home');
    }
  };

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  if (loading || !user) return <p>Loading...</p>;

  return (
    <Container>
      {step === 1 && (
        <>
          <h1>Tell Us About Yourself</h1>
          <p>This helps us create a personalized plan for you.</p>
          <Form>
            <Label htmlFor="height_cm">Height (cm)</Label>
            <Input id="height_cm" name="height_cm" type="number" value={formData.height_cm} onChange={handleChange} />
            {formErrors.height_cm && <p style={{ color: 'red' }}>{formErrors.height_cm}</p>}

            <Label htmlFor="weight_kg">Weight (kg)</Label>
            <Input id="weight_kg" name="weight_kg" type="number" value={formData.weight_kg} onChange={handleChange} />
            {formErrors.weight_kg && <p style={{ color: 'red' }}>{formErrors.weight_kg}</p>}

            <Label htmlFor="age">Age</Label>
            <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} />
            {formErrors.age && <p style={{ color: 'red' }}>{formErrors.age}</p>}

            <Label htmlFor="gender">Gender</Label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <Label htmlFor="weekly_activity_minutes">Weekly Activity (minutes)</Label>
            <Input id="weekly_activity_minutes" name="weekly_activity_minutes" type="number" value={formData.weekly_activity_minutes} onChange={handleChange} />
            {formErrors.weekly_activity_minutes && <p style={{ color: 'red' }}>{formErrors.weekly_activity_minutes}</p>}

            <Label htmlFor="sleep_duration_hours">Nightly Sleep (hours)</Label>
            <Input id="sleep_duration_hours" name="sleep_duration_hours" type="number" value={formData.sleep_duration_hours} onChange={handleChange} />
            {formErrors.sleep_duration_hours && <p style={{ color: 'red' }}>{formErrors.sleep_duration_hours}</p>}
            
            <Button type="button" onClick={handleNextStep}>Next</Button>
          </Form>
        </>
      )}

      {step === 2 && (
        <>
          <h1>What's Your Primary Goal?</h1>
          <Form>
            <select name="physical_goal" value={formData.physical_goal} onChange={handleChange}>
              <option value="lose_weight">Lose Weight</option>
              <option value="gain_weight">Gain Weight</option>
              <option value="build_muscle">Build Muscle</option>
            </select>
            <Button type="button" onClick={handleGeneratePlan}>Generate My Plan</Button>
          </Form>
        </>
      )}

      {step === 3 && (
        <>
          <Lottie options={defaultOptions} height={400} width={400} />
          <h1>Generating your personalized plan...</h1>
        </>
      )}

      {step === 4 && suggestedGoals && (
        <>
          <h1>Your Personalized Plan</h1>
          <p>Here's what we suggest. You can adjust these goals now or later.</p>
          <GoalCard>
            <Label>Daily Calories</Label>
            <Input type="number" value={suggestedGoals.calories} onChange={(e) => setSuggestedGoals(g => ({...g, calories: parseInt(e.target.value)}))} />
            
            <Label>Daily Activity</Label>
            <Input type="number" value={suggestedGoals.activity} onChange={(e) => setSuggestedGoals(g => ({...g, activity: parseInt(e.target.value)}))} />

            <Label>Nightly Sleep</Label>
            <Input type="number" step="0.5" value={suggestedGoals.sleep} onChange={(e) => setSuggestedGoals(g => ({...g, sleep: parseFloat(e.target.value)}))} />
          </GoalCard>
          <Button type="button" onClick={handleSaveGoals}>Save & Start</Button>
        </>
      )}

      {formErrors.form && <p style={{ color: 'red' }}>{formErrors.form}</p>}
    </Container>
  );
}