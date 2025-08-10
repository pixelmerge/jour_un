'use client';
import { useState, useEffect } from 'react';
import styled from '@emotion/styled'; // Fix the import
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient'; // Fix supabase import path
import { useAuth } from '@/context/AuthProvider';

const TimelineContainer = styled.div`
  margin: 2rem 0;
  padding: 0 1rem;
  max-height: 500px;
  overflow-y: auto;
`;

const TimelineItem = styled.div`
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  background: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const TimelineDate = styled.span`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.875rem;
`;

const TimelineHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
`;

const LoadingState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.textSecondary};
`;

export default function Timeline({ type, period, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadEntries = async () => {
      if (!user) return;

      try {
        let query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (period === 'week' ? 7 : 30));

        switch(type) {
          case 'food':
            query = supabase
              .from('food_entries')
              .select('*')
              .eq('user_id', user.id)
              .gte('created_at', startDate.toISOString())
              .order('created_at', { ascending: false });
            break;
          
          case 'activity':
            query = supabase
              .from('activity_entries')
              .select('*')
              .eq('user_id', user.id)
              .gte('created_at', startDate.toISOString())
              .order('created_at', { ascending: false });
            break;
          
          case 'sleep':
            query = supabase
              .from('sleep_entries')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_complete', true)
              .gte('start_time', startDate.toISOString())
              .order('start_time', { ascending: false });
            break;
          
          default:
            return;
        }

        const { data, error } = await query;
        if (error) throw error;
        setEntries(data);
      } catch (error) {
        console.error('Error loading timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [user, type, period]);

  if (loading) {
    return <LoadingState>Loading timeline...</LoadingState>;
  }

  if (!entries.length) {
    return <LoadingState>No entries found for this period.</LoadingState>;
  }

  return (
    <TimelineContainer>
      <TimelineHeader>
        <h2>{type.charAt(0).toUpperCase() + type.slice(1)} History</h2>
      </TimelineHeader>
      {entries.map((entry) => (
        <TimelineItem key={entry.id}>
          {type === 'food' && (
            <div>
              <strong>{entry.food_name}</strong>
              <br />
              <span>Calories: {entry.calories}</span>
            </div>
          )}
          {type === 'activity' && (
            <div>
              <strong>{entry.activity_type}</strong>
              <br />
              <span>{entry.duration_minutes} minutes | {entry.calories_burned} calories</span>
            </div>
          )}
          {type === 'sleep' && (
            <div>
              <strong>{entry.duration_hours} hours</strong>
              <br />
              <span>Quality: {entry.quality}</span>
            </div>
          )}
          <TimelineDate>
            {format(new Date(entry.created_at || entry.start_time), 'MMM d, h:mm a')}
          </TimelineDate>
        </TimelineItem>
      ))}
    </TimelineContainer>
  );
}
