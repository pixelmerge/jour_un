'use client';
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthProvider';

const TimelineContainer = styled.div`
  margin: 2rem 0;
  padding: 0 1rem;
  max-height: 500px;
  overflow-y: auto;
`;

const TimelineHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 1rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text.primary};
    margin: 0;
  }
`;

const TimelineItem = styled.div`
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.primary};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const TimelineDate = styled.span`
  color: ${({ theme }) => theme.text.secondary};
  font-size: 0.875rem;
  white-space: nowrap;
  margin-left: 1rem;
`;

const EntryContent = styled.div`
  flex: 1;
`;

const EntryTitle = styled.strong`
  display: block;
  margin-bottom: 0.25rem;
  color: ${({ theme }) => theme.text.primary};
  font-weight: 600;
`;

const EntryDetails = styled.span`
  color: ${({ theme }) => theme.text.secondary};
  font-size: 0.875rem;
`;

const LoadingState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.text.secondary};
`;

export default function Timeline({ type, period = 'week', onClose, onUpdate }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Get user from auth context

  useEffect(() => {
    const loadEntries = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (period === 'week' ? 7 : 30));

        let query = supabase
          .from(`${type}_entries`)
          .select('*')
          .eq('user_id', user.id);

        // Add type-specific conditions
        if (type === 'sleep') {
          query = query
            .eq('is_complete', true)
            .gte('start_time', startDate.toISOString())
            .order('start_time', { ascending: false });
        } else {
          query = query
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;
        setEntries(data || []);
      } catch (error) {
        console.error(`Error loading ${type} timeline:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [user?.id, type, period]); // Use user?.id instead of user

  if (!user) {
    return (
      <LoadingState>Please sign in to view your timeline.</LoadingState>
    );
  }

  if (loading) {
    return <LoadingState>Loading timeline...</LoadingState>;
  }

  if (!entries.length) {
    return (
      <LoadingState>
        No {type} entries found for this {period}.
      </LoadingState>
    );
  }

  return (
    <TimelineContainer>
      <TimelineHeader>
        <h2>{type.charAt(0).toUpperCase() + type.slice(1)} History</h2>
      </TimelineHeader>
      {entries.map((entry) => (
        <TimelineItem key={entry.id}>
          <EntryContent>
            {type === 'food' && (
              <>
                <EntryTitle>{entry.food_name}</EntryTitle>
                <EntryDetails>
                  {entry.calories} calories • {entry.portion_size}
                </EntryDetails>
              </>
            )}
            {type === 'sleep' && (
              <>
                <EntryTitle>{entry.duration_hours} hours</EntryTitle>
                <EntryDetails>
                  Quality: {entry.quality}
                </EntryDetails>
              </>
            )}
            {type === 'activity' && (
              <>
                <EntryTitle>{entry.activity_type}</EntryTitle>
                <EntryDetails>
                  {entry.duration_minutes} min • {entry.calories_burned} calories
                </EntryDetails>
              </>
            )}
          </EntryContent>
          <TimelineDate>
            {format(
              new Date(entry.created_at || entry.start_time), 
              'MMM d, h:mm a'
            )}
          </TimelineDate>
        </TimelineItem>
      ))}
    </TimelineContainer>
  );
}