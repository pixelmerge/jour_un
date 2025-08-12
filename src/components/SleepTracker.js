'use client';
import { useState } from 'react';
import styled from '@emotion/styled';
import LottieOverlay from './ui/LottieOverlay';
import { Button as UIButton } from './ui/Button';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background-color: ${({ theme }) => theme.cardBg};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.borderColor};
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
`;

// Use shared UIButton to keep styles consistent

export default function SleepTracker(props) {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [overlay, setOverlay] = useState({ show: false, segment: null });
  const [animOpen, setAnimOpen] = useState(false);
  const [animCfg, setAnimCfg] = useState(null);

  const playSleepStart = () => {
  setAnimCfg({ path: '/animations/sleep.json', initialSegment: [0, 90], speed: 0.5, durationMs: 3000 });
    setAnimOpen(true);
  };
  const playWakeUp = () => {
  setAnimCfg({ path: '/animations/wake.json', fallbackPath: '/animations/sleep.json', initialSegment: [380, 480], speed: 0.5, durationMs: 3000 });
    setAnimOpen(true);
  };

  const handleStartSleep = async () => {
    try {
      if (!user) {
        setError('Please sign in to track your sleep');
        return;
      }

      const { data: existingEntry, error: checkError } = await supabase
        .from('sleep_entries')
        .select('id, start_time')
        .eq('user_id', user.id)
        .eq('is_complete', false)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing entry:', checkError);
        throw checkError;
      }

      if (existingEntry) {
        setError('You already have an active sleep session');
        return;
      }

      const { error } = await supabase
        .from('sleep_entries')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          quality: 'Pending',
          is_complete: false
        });

      if (error) throw error;

      setSuccess('Sleep start time logged successfully! 😴');
      setError('');
      playSleepStart();
      // overlay will auto-close at segment end (no durationMs set)
      props.onSuccess?.('start');
    } catch (err) {
      console.error('Error logging sleep:', err);
      setError('Failed to log sleep start time');
      setSuccess('');
    }
  };

  const handleWakeUp = async () => {
    try {
      if (!user) {
        setError('Please sign in to track your sleep');
        return;
      }

      // Get the last incomplete sleep entry
      const { data: lastEntry, error: fetchError } = await supabase
        .from('sleep_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_complete', false)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching sleep entry:', fetchError);
        throw fetchError;
      }

      if (!lastEntry) {
        setError('No active sleep session found. Please click "Going to Bed Now" first.');
        return;
      }

      const startTime = new Date(lastEntry.start_time);
      const endTime = new Date();
      const duration = Number(((endTime - startTime) / (1000 * 60 * 60)).toFixed(2));

      let quality = 'Poor';
      if (duration >= 7 && duration <= 9) {
        quality = 'Good';
      } else if (duration > 9) {
        quality = 'Oversleep';
      } else if (duration < 4) {
        quality = 'Very Poor';
      }

      const { error } = await supabase
        .from('sleep_entries')
        .update({
          end_time: endTime.toISOString(),
          duration_hours: duration,
          is_complete: true,
          quality: quality
        })
        .eq('id', lastEntry.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating sleep entry:', error);
        throw error;
      }

      setSuccess(`Wake up time logged! You slept for ${duration} hours (${quality} quality)`);
      setError('');
      playWakeUp();
      props.onSuccess?.('wake');
    } catch (err) {
      console.error('Error logging wake up:', err);
      setError('Failed to log wake up time. Please try again.');
      setSuccess('');
    }
  };

  return (
    <>
      <LottieOverlay
        open={animOpen}
  animationPath={animCfg?.path}
  fallbackAnimationPath={animCfg?.fallbackPath}
        initialSegment={animCfg?.initialSegment}
  speed={animCfg?.speed ?? 0.5}
  durationMs={animCfg?.durationMs}
  stripWhite
        onClose={() => setAnimOpen(false)}
      />
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginBottom: '1rem' }}>{success}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <UIButton variant="secondary" size="small" onClick={handleStartSleep} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <span role="img" aria-label="bed time" style={{ fontSize: '1.5rem' }}>🛏️</span>
          Going to Bed Now
        </UIButton>
        <UIButton variant="secondary" size="small" onClick={handleWakeUp} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <span role="img" aria-label="wake up" style={{ fontSize: '1.5rem' }}>🌅</span>
          Just Woke Up
        </UIButton>
      </div>
    </>
  );
};