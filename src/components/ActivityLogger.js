'use client';
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import LottieOverlay from './ui/LottieOverlay';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.primaryButton.background};
  color: ${({ theme }) => theme.primaryButton.text};
  cursor: pointer;
  margin: 0.5rem;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default function ActivityLogger({ onSuccess }) {
  const { user } = useAuth();
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [animOpen, setAnimOpen] = useState(false);
  const [animCfg, setAnimCfg] = useState(null);

  useEffect(() => {
    setTextInput(transcript);
  }, [transcript]);

  const handleListen = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
    setIsListening(!isListening);
  };
  
  const handleAnalyze = async () => {
    try {
      setError('');
      setLoading(true);

      if (!user) {
        throw new Error('Please sign in to analyze activities');
      }

      if (!textInput.trim()) {
        throw new Error('Please describe your activity');
      }

      const { data } = await axios.post('/api/analyze-activity', {
        description: textInput.trim(),
        userId: user.id
      });

      if (data.success && data.output) {
        const {
          activity,
          duration_minutes,
          estimated_calories_burned,
          intensity_level,
          disclaimer,
          calculation_details
        } = data.output;

        setAnalysis({
          activity,
          duration_minutes,
          calories_burned: estimated_calories_burned,
          intensity_level,
          disclaimer,
          calculation: calculation_details
        });
      } else {
        throw new Error(data.error || 'Failed to analyze activity');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const showSavedAnim = () => {
    setAnimCfg({ path: '/animations/run.json', durationMs: 3000, speed: 0.5 });
    setAnimOpen(true);
    setTimeout(() => setAnimOpen(false), 3000);
  };

  const handleSave = async () => {
    if (!analysis || !user) return;
    
    try {
      const entry = {
        user_id: user.id,
        description: textInput,
        activity_type: analysis.activity,
        duration_minutes: Math.round(analysis.duration_minutes),
        calories_burned: Math.round(analysis.calories_burned),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('activity_entries')
        .insert([entry])
        .select()
        .single();

      if (error) {
        throw error;
      }

      showSavedAnim();
      onSuccess?.(data);
      setTextInput('');
      setAnalysis(null);
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Failed to save activity. Please try again.');
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn&apos;t support speech recognition.</span>;
  }

  return (
    <>
      <LottieOverlay
        open={animOpen}
        animationPath={animCfg?.path}
        durationMs={animCfg?.durationMs}
        speed={animCfg?.speed ?? 0.5}
        onClose={() => setAnimOpen(false)}
      />
      <div>
        <h3>Log Your Activity</h3>
        <textarea 
          value={textInput} 
          onChange={(e) => setTextInput(e.target.value)} 
          rows="4" 
          placeholder={"Describe your activity (e.g., \"I walked for 30 minutes\")"}
          style={{ 
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }} 
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <Button 
            onClick={handleListen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: isListening ? '#ff4444' : undefined
            }}
          >
            <span role="img" aria-label="microphone">
              {isListening ? '🔴' : '🎤'}
            </span>
            {isListening ? 'Stop Recording' : 'Start Recording'}
          </Button>
          <Button 
            onClick={handleAnalyze} 
            disabled={!textInput || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span role="img" aria-label="analyze">
              {loading ? '⏳' : '📊'}
            </span>
            {loading ? 'Analyzing...' : 'Analyze Activity'}
          </Button>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        {analysis && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.05)',
            marginBottom: '1rem'
          }}>
            <h4>Analysis Results:</h4>
            <p><strong>Activity:</strong> {analysis.activity}</p>
            <p><strong>Duration:</strong> {analysis.duration_minutes} minutes</p>
            <p><strong>Estimated Calories Burned:</strong> {analysis.calories_burned}</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>{analysis.disclaimer}</p>
            <Button onClick={handleSave}>Save Activity</Button>
          </div>
        )}
      </div>
    </>
  );
};