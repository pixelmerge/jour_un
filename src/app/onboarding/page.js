'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import Lottie from 'react-lottie';
import animationData from '../../../public/animations/onboarding.json';
import { z } from 'zod';
import { FiChevronLeft, FiChevronRight, FiTarget, FiActivity, FiMoon, FiUser, FiHeart, FiTrendingUp, FiCheck } from 'react-icons/fi';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
`;

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
  
  @media (min-width: 768px) {
    padding: 2rem;
    max-width: 600px;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 1rem 0 2rem;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 2px;
  width: ${props => props.progress}%;
  transition: width 0.5s ease;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const StepDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? '#fff' : 'rgba(255, 255, 255, 0.4)'};
  transition: all 0.3s ease;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  @media (min-width: 768px) {
    padding: 2.5rem 2rem;
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem;
  text-align: center;
  
  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1rem;
  text-align: center;
  margin: 0 0 2rem;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 16px;
  background: #f8fafc;
  color: #1a1a1a;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 16px;
  background: #f8fafc;
  color: #1a1a1a;
  font-size: 1rem;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    background-color: #fff;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }
`;

const GoalOption = styled.div`
  padding: 1.5rem;
  border: 2px solid ${props => props.selected ? '#667eea' : '#e1e8ed'};
  border-radius: 16px;
  background: ${props => props.selected ? 'rgba(102, 126, 234, 0.05)' : '#f8fafc'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  &:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }
`;

const GoalIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const GoalInfo = styled.div`
  flex: 1;
  
  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 0.25rem;
  }
  
  p {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.4;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 1rem 2rem;
  border-radius: 16px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 56px;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }
    
    &:disabled {
      opacity: 0.6;
      transform: none;
      box-shadow: none;
      cursor: not-allowed;
    }
  ` : `
    background: #f8fafc;
    color: #666;
    border: 2px solid #e1e8ed;
    
    &:hover {
      background: #fff;
      border-color: #667eea;
      color: #667eea;
    }
  `}
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 2px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 1rem;
`;

const SuccessAnimation = styled.div`
  text-align: center;
  padding: 2rem 0;
  
  .lottie-container {
    margin-bottom: 1rem;
  }
`;

const GoalSummaryCard = styled.div`
  background: #f8fafc;
  border-radius: 16px;
  padding: 1.5rem;
  margin: 1rem 0;
  
  .goal-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e1e8ed;
    
    &:last-child {
      border-bottom: none;
    }
    
    .goal-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      color: #333;
    }
    
    .goal-value {
      font-weight: 600;
      color: #667eea;
    }
  }
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
  physical_goal: z.enum(['lose_weight', 'gain_weight', 'maintain_weight']),
  target_weight_change_kg: z.number().positive().optional(),
  target_weeks: z.number().positive().int().min(1).optional(),
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
    target_weight_change_kg: '',
    target_weeks: '',
  });
  const [suggestedGoals, setSuggestedGoals] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const getStepProgress = () => (step / 4) * 100;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoalSelect = (goal) => {
    setFormData(prev => ({ ...prev, physical_goal: goal }));
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

  const handleValidateGoal = () => {
    setFormErrors({});
    const dataToValidate = {
      ...formData,
      target_weight_change_kg: formData.physical_goal !== 'maintain_weight' ? parseFloat(formData.target_weight_change_kg) : undefined,
      target_weeks: formData.physical_goal !== 'maintain_weight' ? parseInt(formData.target_weeks) : undefined,
    };

    const result = goalSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errors = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0]] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    // Validate for safe goals
    if (formData.physical_goal === 'lose_weight') {
        const weeklyChange = dataToValidate.target_weight_change_kg / dataToValidate.target_weeks;
        if (weeklyChange > 1) {
            setFormErrors({ form: 'A safe weight loss goal is a maximum of 1kg per week.' });
            return;
        }
    }
    if (formData.physical_goal === 'gain_weight') {
        const weeklyChange = dataToValidate.target_weight_change_kg / dataToValidate.target_weeks;
        if (weeklyChange > 0.5) {
            setFormErrors({ form: 'A safe weight gain goal is a maximum of 0.5kg per week.' });
            return;
        }
    }

    handleGeneratePlan();
  };

  const handleGeneratePlan = async () => {
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
          target_weight_change_kg: formData.target_weight_change_kg,
          target_weeks: formData.target_weeks,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate plan.');

      const data = await response.json();
      const recommendations = data.personalized_recommendations;
      const parseValue = (value) => {
        if (typeof value === 'string' && value.includes('-')) {
          const parts = value.split('-').map(s => parseFloat(s.trim()));
          return Math.round((parts[0] + parts[1]) / 2);
        }
        return parseFloat(value);
      };
      setSuggestedGoals({
        calories: parseValue(recommendations.daily_calorie_target?.value || ''),
        activity: parseValue(recommendations.physical_activity_per_week?.aerobic?.value || recommendations.physical_activity_per_week?.value || ''),
        sleep: parseValue(recommendations.daily_sleep_target?.value || recommendations.sleep_target?.value || ''),
      });
      setStep(4);
    } catch (error) {
      setFormErrors({ form: error.message });
      setStep(2); // Go back to the goal selection
    } finally {
      setIsGenerating(false);
    }
  };

  const [aiConsent, setAiConsent] = useState(true);

  const handleSaveGoals = async () => {
    // Only include valid fields for user_profiles
    const validFields = [
      'height_cm',
      'weight_kg',
      'age',
      'gender',
      'weekly_activity_minutes',
      'sleep_duration_hours',
      'physical_goal',
      'target_weight_change_kg',
      'target_weeks',
      'daily_calorie_target',
      'activity_minutes_target',
  'sleep_target_hours',
  'onboarding_complete',
  'ai_consent',
    ];
    // Convert numeric fields to numbers, remove empty strings
    const numericFields = [
      'height_cm', 'weight_kg', 'age', 'weekly_activity_minutes', 'sleep_duration_hours',
      'target_weight_change_kg', 'target_weeks', 'daily_calorie_target', 'activity_minutes_target', 'sleep_target_hours'
    ];
    const rawData = {
      ...formData,
      daily_calorie_target: suggestedGoals.calories,
      activity_minutes_target: suggestedGoals.activity,
      sleep_target_hours: suggestedGoals.sleep,
      onboarding_complete: true,
      ai_consent: aiConsent,
    };
    const finalData = Object.fromEntries(
      Object.entries(rawData)
        .filter(([key, value]) => validFields.includes(key) && value !== '' && value !== undefined && value !== null)
        .map(([key, value]) => [key, numericFields.includes(key) ? Number(value) : value])
    );

    const { error } = await supabase
      .from('user_profiles')
      .update(finalData)
      .eq('id', user.id);

    if (error) {
      setFormErrors({ form: 'Could not save your profile. Please try again.' });
    } else {
      // Success animation with redirect
      setTimeout(() => {
        router.push('/');
      }, 2000);
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

  if (loading || !user) {
    return (
      <AppContainer>
        <Container>
          <Card>
            <Title>Loading...</Title>
          </Card>
        </Container>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Container>
        <ProgressBar>
          <ProgressFill progress={getStepProgress()} />
        </ProgressBar>
        
        <StepIndicator>
          {[1, 2, 3, 4].map(stepNum => (
            <StepDot key={stepNum} active={stepNum <= step} />
          ))}
        </StepIndicator>

        <Card>
          {step === 1 && (
            <>
              <Title>Tell us about yourself</Title>
              <Subtitle>Help us create your personalized health journey</Subtitle>
              
              <Form>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormGroup>
                    <Label htmlFor="height_cm">
                      <FiUser /> Height (cm)
                    </Label>
                    <Input 
                      id="height_cm" 
                      name="height_cm" 
                      type="number" 
                      placeholder="170"
                      value={formData.height_cm} 
                      onChange={handleChange} 
                    />
                    {formErrors.height_cm && <ErrorMessage>{formErrors.height_cm}</ErrorMessage>}
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="weight_kg">
                      <FiTarget /> Weight (kg)
                    </Label>
                    <Input 
                      id="weight_kg" 
                      name="weight_kg" 
                      type="number" 
                      placeholder="70"
                      value={formData.weight_kg} 
                      onChange={handleChange} 
                    />
                    {formErrors.weight_kg && <ErrorMessage>{formErrors.weight_kg}</ErrorMessage>}
                  </FormGroup>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormGroup>
                    <Label htmlFor="age">
                      <FiUser /> Age
                    </Label>
                    <Input 
                      id="age" 
                      name="age" 
                      type="number" 
                      placeholder="25"
                      value={formData.age} 
                      onChange={handleChange} 
                    />
                    {formErrors.age && <ErrorMessage>{formErrors.age}</ErrorMessage>}
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  </FormGroup>
                </div>

                <FormGroup>
                  <Label htmlFor="weekly_activity_minutes">
                    <FiActivity /> Weekly Activity (minutes)
                  </Label>
                  <Input 
                    id="weekly_activity_minutes" 
                    name="weekly_activity_minutes" 
                    type="number" 
                    placeholder="150"
                    value={formData.weekly_activity_minutes} 
                    onChange={handleChange} 
                  />
                  {formErrors.weekly_activity_minutes && <ErrorMessage>{formErrors.weekly_activity_minutes}</ErrorMessage>}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="sleep_duration_hours">
                    <FiMoon /> Nightly Sleep (hours)
                  </Label>
                  <Input 
                    id="sleep_duration_hours" 
                    name="sleep_duration_hours" 
                    type="number" 
                    step="0.5"
                    placeholder="8"
                    value={formData.sleep_duration_hours} 
                    onChange={handleChange} 
                  />
                  {formErrors.sleep_duration_hours && <ErrorMessage>{formErrors.sleep_duration_hours}</ErrorMessage>}
                </FormGroup>
                
                <ButtonContainer>
                  <Button variant="primary" type="button" onClick={handleNextStep}>
                    Next Step <FiChevronRight />
                  </Button>
                </ButtonContainer>
              </Form>
            </>
          )}

          {step === 2 && (
            <>
              <Title>What's your goal?</Title>
              <Subtitle>Choose your primary health and fitness objective</Subtitle>
              
              <Form>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <GoalOption 
                    selected={formData.physical_goal === 'lose_weight'}
                    onClick={() => handleGoalSelect('lose_weight')}
                  >
                    <GoalIcon><FiTrendingUp /></GoalIcon>
                    <GoalInfo>
                      <h3>Lose Weight</h3>
                      <p>Create a sustainable calorie deficit to reach your target weight</p>
                    </GoalInfo>
                  </GoalOption>

                  <GoalOption 
                    selected={formData.physical_goal === 'gain_weight'}
                    onClick={() => handleGoalSelect('gain_weight')}
                  >
                    <GoalIcon><FiTarget /></GoalIcon>
                    <GoalInfo>
                      <h3>Gain Weight</h3>
                      <p>Build healthy muscle mass with proper nutrition and training</p>
                    </GoalInfo>
                  </GoalOption>

                  <GoalOption 
                    selected={formData.physical_goal === 'maintain_weight'}
                    onClick={() => handleGoalSelect('maintain_weight')}
                  >
                    <GoalIcon><FiHeart /></GoalIcon>
                    <GoalInfo>
                      <h3>Maintain Weight</h3>
                      <p>Focus on overall health and maintaining your current weight</p>
                    </GoalInfo>
                  </GoalOption>
                </div>

                {formData.physical_goal !== 'maintain_weight' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                    <FormGroup>
                      <Label htmlFor="target_weight_change_kg">
                        Target weight change (kg)
                      </Label>
                      <Input 
                        id="target_weight_change_kg" 
                        name="target_weight_change_kg" 
                        type="number" 
                        placeholder="5"
                        value={formData.target_weight_change_kg} 
                        onChange={handleChange} 
                      />
                      {formErrors.target_weight_change_kg && <ErrorMessage>{formErrors.target_weight_change_kg}</ErrorMessage>}
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="target_weeks">Time frame (weeks)</Label>
                      <Input 
                        id="target_weeks" 
                        name="target_weeks" 
                        type="number" 
                        placeholder="12"
                        value={formData.target_weeks} 
                        onChange={handleChange} 
                      />
                      {formErrors.target_weeks && <ErrorMessage>{formErrors.target_weeks}</ErrorMessage>}
                    </FormGroup>
                  </div>
                )}
                
                <ButtonContainer>
                  <Button variant="secondary" type="button" onClick={() => setStep(1)}>
                    <FiChevronLeft /> Back
                  </Button>
                  <Button variant="primary" type="button" onClick={handleValidateGoal}>
                    Generate Plan <FiChevronRight />
                  </Button>
                </ButtonContainer>
              </Form>
            </>
          )}

          {step === 3 && (
            <SuccessAnimation>
              <div className="lottie-container">
                <Lottie options={defaultOptions} height={200} width={200} />
              </div>
              <Title>Creating your plan...</Title>
              <Subtitle>We're analyzing your data to create the perfect personalized program</Subtitle>
            </SuccessAnimation>
          )}

          {step === 4 && suggestedGoals && (
            <>
              <Title>Your personalized plan</Title>
              <Subtitle>Here are your recommended daily targets. You can adjust them anytime.</Subtitle>
              
              <GoalSummaryCard>
                <div className="goal-item">
                  <div className="goal-label">
                    <FiTarget /> Daily Calories
                  </div>
                  <div className="goal-value">
                    <Input 
                      type="number" 
                      value={suggestedGoals.calories || ''} 
                      onChange={(e) => setSuggestedGoals(g => ({...g, calories: parseInt(e.target.value)}))}
                      style={{ width: '100px', textAlign: 'center', padding: '0.5rem' }}
                    />
                  </div>
                </div>
                
                <div className="goal-item">
                  <div className="goal-label">
                    <FiActivity /> Weekly Activity (min)
                  </div>
                  <div className="goal-value">
                    <Input 
                      type="number" 
                      value={suggestedGoals.activity || ''} 
                      onChange={(e) => setSuggestedGoals(g => ({...g, activity: parseInt(e.target.value)}))}
                      style={{ width: '100px', textAlign: 'center', padding: '0.5rem' }}
                    />
                  </div>
                </div>

                <div className="goal-item">
                  <div className="goal-label">
                    <FiMoon /> Nightly Sleep (hours)
                  </div>
                  <div className="goal-value">
                    <Input 
                      type="number" 
                      step="0.5" 
                      value={suggestedGoals.sleep || ''} 
                      onChange={(e) => setSuggestedGoals(g => ({...g, sleep: parseFloat(e.target.value)}))}
                      style={{ width: '100px', textAlign: 'center', padding: '0.5rem' }}
                    />
                  </div>
                </div>
              </GoalSummaryCard>
              
              <ButtonContainer>
                <Button variant="secondary" type="button" onClick={() => setStep(2)}>
                  <FiChevronLeft /> Back
                </Button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    <input type="checkbox" checked={aiConsent} onChange={(e) => setAiConsent(e.target.checked)} />
                    <span style={{ color: '#334155' }}>Allow AI processing for personalized insights</span>
                  </label>
                  <Button variant="primary" type="button" onClick={handleSaveGoals}>
                    <FiCheck /> Start My Journey
                  </Button>
                </div>
              </ButtonContainer>
            </>
          )}

          {formErrors.form && <ErrorMessage>{formErrors.form}</ErrorMessage>}
        </Card>
      </Container>
    </AppContainer>
  );
}