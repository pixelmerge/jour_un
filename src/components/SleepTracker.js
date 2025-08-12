'use client';
import { useState } from 'react';
import styled from '@emotion/styled';
import LottieOverlay from './ui/LottieOverlay';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { differenceInHours } from 'date-fns';

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

const Button = styled.button`
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: white;
  font-weight: bold;
  cursor: pointer;
`;

const SleepTracker = ({ onSuccess, onUpdate }) => {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [overlay, setOverlay] = useState({ show: false, segment: null });
  
  const handleSleepStart = async () => {
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

      const { data, error: insertError } = await supabase
        .from('sleep_entries')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          quality: 'Pending',
          is_complete: false
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

  setSuccess('Sleep start time logged successfully! 😴');
      setError('');
  setOverlay({ show: true, segment: [0, 90] });
      if (onUpdate) await onUpdate();
      if (onSuccess) onSuccess();
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

      const { error: updateError } = await supabase
        .from('sleep_entries')
        .update({
          end_time: endTime.toISOString(),
          duration_hours: duration,
          is_complete: true,
          quality: quality
        })
        .eq('id', lastEntry.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating sleep entry:', updateError);
        throw updateError;
      }

  setSuccess(`Wake up time logged! You slept for ${duration} hours (${quality} quality)`);
      setError('');
  setOverlay({ show: true, segment: [380, 480] });
      if (onSuccess) onSuccess();
      if (onUpdate) onUpdate(); // Call onUpdate to refresh stats
    } catch (err) {
      console.error('Error logging wake up:', err);
      setError('Failed to log wake up time. Please try again.');
      setSuccess('');
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <LottieOverlay 
        show={overlay.show}
        path="/animations/sleep and wake.json"
        initialSegment={overlay.segment || undefined}
        loop={false}
        speed={0.5}
        onHide={() => setOverlay({ show: false, segment: null })}
      />
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginBottom: '1rem' }}>{success}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Button onClick={handleSleepStart} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <span role="img" aria-label="bed time" style={{ fontSize: '1.5rem' }}>🛏️</span>
          Going to Bed Now
        </Button>
        <Button onClick={handleWakeUp} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <span role="img" aria-label="wake up" style={{ fontSize: '1.5rem' }}>🌅</span>
          Just Woke Up
        </Button>
      </div>
    </div>
  );
};

export default SleepTracker;