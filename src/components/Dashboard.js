import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { startOfDay, subDays, subWeeks, subMonths } from 'date-fns';
import FoodLogger from './FoodLogger';
import SleepTracker from './SleepTracker';
import ActivityLogger from './ActivityLogger';
import Modal from './ui/Modal';
import Timeline from './ui/Timeline';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); // Increased from 280px
  }
`;

const Header = styled.header`
  background: ${props => props.theme.background.secondary};
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid ${props => props.theme.border.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
`;

const PeriodButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border.primary};
  background: ${props => 
    props.isSelected 
      ? props.theme.primaryButton.background 
      : 'transparent'};
  color: ${props => 
    props.isSelected 
      ? '#ffffff' 
      : props.theme.text.primary};
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: ${props => props.isSelected ? '600' : 'normal'};
  transition: all 0.2s ease;
  flex: 1;
  max-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: ${props => 
      props.isSelected 
        ? props.theme.primaryButton.hover 
        : props.theme.background.hover};
  }
`;

const StatCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 0.75rem; // Reduced from 1rem
  background: ${props => props.theme.card.background};
  border: 1px solid ${props => props.theme.card.border};
  transition: transform 0.2s, box-shadow 0.2s;
  padding: 1.25rem;
  min-height: 320px; // Increased from 280px

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }
`;

const StatValue = styled.div`
  font-size: 1.1rem; // Made even smaller to give more space to visuals
  font-weight: bold;
  color: ${props => props.theme.text.accent};
`;

const Chart = styled.div`
  margin: 1rem 0;
  height: 180px;    // Increased from 140px
  position: relative;
  border-radius: 8px;
  overflow: hidden;
`;

const StatLabel = styled.div`
  color: ${props => props.theme.text.secondary};
  font-size: 0.75rem; // Reduced from 0.875rem
  font-weight: 500;
`;

const TimelineButton = styled(Button)`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.5rem;
  min-width: auto;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.background.secondary};
  opacity: 0.8;
  transition: opacity 0.2s;
  z-index: 10; // Ensure button is clickable

  &:hover {
    opacity: 1;
    background: ${props => props.theme.background.hover};
  }
`;

const LogButton = styled(Button)`
  color: #ffffff; // Always white for contrast
  background: ${({ theme }) => theme.primaryButton.background};
  
  &:hover {
    background: ${({ theme }) => theme.primaryButton.hover};
  }
`;

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [activeLogger, setActiveLogger] = useState(null);
  const [timelineView, setTimelineView] = useState(null);
  const [stats, setStats] = useState({
    calories: { consumed: 0, burned: 0, target: 2000 },
    sleep: { hours: 0, quality: 'N/A' },
    activity: { minutes: 0, type: 'None' }
  });

  const fetchStats = async () => {
    if (!user) return;

    const startDate = (() => {
      const now = new Date();
      switch (selectedPeriod) {
        case 'today':
          return startOfDay(now);
        case 'week':
          return subWeeks(now, 1);
        case 'month':
          return subMonths(now, 1);
        default:
          return startOfDay(now);
      }
    })();

    try {
      // Fetch food entries
      const { data: foodData } = await supabase
        .from('food_entries')
        .select('calories')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Fetch activity entries
      const { data: activityData } = await supabase
        .from('activity_entries')
        .select('calories_burned, duration_minutes, activity_type')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Fetch sleep entries
      const { data: sleepData } = await supabase
        .from('sleep_entries')
        .select('duration_hours, quality')
        .eq('user_id', user.id)
        .eq('is_complete', true)
        .gte('start_time', startDate.toISOString())
        .order('start_time', { ascending: false })
        .limit(1);

      const totalCaloriesConsumed = foodData?.reduce((sum, entry) => sum + entry.calories, 0) || 0;
      const totalCaloriesBurned = activityData?.reduce((sum, entry) => sum + entry.calories_burned, 0) || 0;
      const totalActivityMinutes = activityData?.reduce((sum, entry) => sum + entry.duration_minutes, 0) || 0;
      const lastSleepHours = sleepData?.[0]?.duration_hours || 0;
      const lastSleepQuality = sleepData?.[0]?.quality || 'N/A';

      setStats({
        calories: { consumed: totalCaloriesConsumed, burned: totalCaloriesBurned, target: 2000 },
        sleep: { hours: lastSleepHours, quality: lastSleepQuality },
        activity: { minutes: totalActivityMinutes, type: activityData?.[0]?.activity_type || 'None' }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, selectedPeriod]);

  // Pass fetchStats to the sleep buttons
  const handleSleepStart = async () => {
    try {
      const { data: existingEntry } = await supabase
        .from('sleep_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_complete', false)
        .single();

      if (existingEntry) {
        alert('You already have an active sleep session. Please log wake up first.');
        return;
      }

      const { error } = await supabase
        .from('sleep_entries')
        .insert([{
          user_id: user.id,
          start_time: new Date().toISOString(),
          is_complete: false
        }]);

      if (error) throw error;
      
      alert('Sleep time logged! Sweet dreams! 😴');
      await fetchStats();
    } catch (err) {
      console.error('Error logging sleep:', err);
      alert('Failed to log sleep time. Please try again.');
    }
  };

  return (
    <div>
      <Header>
        <div style={{ 
          display: 'flex', 
          gap: '0.25rem',
          background: props => props.theme.background.hover,
          padding: '0.25rem',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '360px'
        }}>
          {[
            { value: 'today', label: 'Today', icon: '📅' },
            { value: 'week', label: 'Week', icon: '📊' },
            { value: 'month', label: 'Month', icon: '📈' }
          ].map(period => (
            <PeriodButton
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              isSelected={selectedPeriod === period.value}
            >
              <span role="img" aria-label={period.label}>{period.icon}</span>
              {period.label}
            </PeriodButton>
          ))}
        </div>
      </Header>

      <DashboardContainer>
        <AnimatePresence mode="popLayout">
          {[
            {
              key: 'calories',
              label: 'Calories Today',
              value: stats.calories.consumed - stats.calories.burned,
              detail: `${stats.calories.consumed} consumed - ${stats.calories.burned} burned`,
              chart: true,
              action: '🍽️ Log Meal',
              delay: 0
            },
            {
              key: 'sleep',
              label: 'Sleep',
              value: `${stats.sleep.hours}hrs`,
              detail: `Quality: ${stats.sleep.quality}`,
              chart: (
                <Chart>
                  <svg width="100%" height="100" viewBox="0 0 100 80" preserveAspectRatio="none">
                    {/* Sleep quality representation */}
                    <rect x="10" y="40" width="80" height="20" fill="#f0f0f0" rx="4" />
                    <rect
                      x="10"
                      y="40"
                      width={stats.sleep.hours >= 8 ? 80 : (stats.sleep.hours / 8) * 80}
                      height="20"
                      fill="#7E57C2"
                      rx="4"
                    />
                    <text
                      x="50"
                      y="35"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="10"
                    >
                      Target: 8hrs
                    </text>
                  </svg>
                </Chart>
              ),
              action: '😴 Log Sleep',
              delay: 0.1
            },
            {
              key: 'activity',
              label: 'Activity',
              value: `${stats.activity.minutes}min`,
              detail: `Type: ${stats.activity.type}`,
              chart: (
                <Chart>
                  <svg width="100%" height="120" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Activity bar chart */}
                    <rect x="20" y="20" width="15" height="60" fill="#f0f0f0" rx="4" />
                    <rect
                      x="20"
                      y={80 - (stats.activity.minutes / 60) * 60}
                      width="15"
                      height={(stats.activity.minutes / 60) * 60}
                      fill="#FF7043"
                      rx="4"
                    />
                    <text
                      x="27.5"
                      y="90"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="10"
                    >
                      Today
                    </text>
                    {/* Target line */}
                    <line
                      x1="10"
                      y1="50"
                      x2="90"
                      y2="50"
                      stroke="#666"
                      strokeDasharray="2,2"
                    />
                    <text
                      x="95"
                      y="53"
                      textAnchor="end"
                      fill="currentColor"
                      fontSize="8"
                    >
                      30min
                    </text>
                  </svg>
                </Chart>
              ),
              action: '🏃‍♂️ Log Activity',
              delay: 0.2
            }
          ].map(({ key, label, value, detail, action, delay }) => (
            <StatCard
              key={key}
              as={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay }}
              layout
            >
              <StatLabel>{label}</StatLabel>
              <StatValue>{value}</StatValue>
              <div style={{ color: 'gray' }}>{detail}</div>
              {key === 'calories' && (
                <div style={{ margin: '0.5rem 0' }}>
                  <svg width="100%" height="160" viewBox="0 0 100 100"> {/* Increased height */}
                    <circle
                      cx="50"
                      cy="50" // Adjusted center point
                      r="40"   // Increased radius
                      fill="none"
                      stroke="#f0f0f0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#4CAF50"
                      strokeWidth="8"
                      strokeDasharray={`${(stats.calories.consumed / stats.calories.target) * 251.2} 251.2`}
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dasharray 0.3s ease' }}
                    />
                    <text
                      x="50"
                      y="45"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {Math.round((stats.calories.consumed / stats.calories.target) * 100)}%
                    </text>
                    <text
                      x="50"
                      y="60"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="8"
                    >
                      of {stats.calories.target} target
                    </text>
                  </svg>
                </div>
              )}
              {key === 'sleep' && (
                <div style={{ margin: '0.5rem 0' }}>
                  <svg width="100%" height="140" viewBox="0 0 100 100"> {/* Increased height and adjusted viewBox */}
                    <rect x="10" y="30" width="80" height="30" fill="#f0f0f0" rx="4" />
                    <rect
                      x="10"
                      y="30"
                      width={stats.sleep.hours >= 8 ? 80 : (stats.sleep.hours / 8) * 80}
                      height="30"
                      fill="#7E57C2"
                      rx="4"
                    />
                    <text
                      x="50"
                      y="75"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="8"
                    >
                      {stats.sleep.hours} of 8 hours recommended
                    </text>
                  </svg>
                </div>
              )}
              {key === 'activity' && (
                <div style={{ margin: '0.5rem 0' }}>
                  <svg width="100%" height="160" viewBox="0 0 100 120"> {/* Increased height and adjusted viewBox */}
                    <defs>
                      <linearGradient id="activityGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#FF7043" />
                        <stop offset="100%" stopColor="#FFB74D" />
                      </linearGradient>
                    </defs>
                    <rect x="10" y="10" width="80" height="80" fill="#f0f0f0" rx="4" /> {/* Increased height */}
                    <rect
                      x="10"
                      y={90 - (stats.activity.minutes / 60) * 80}
                      width="80"
                      height={(stats.activity.minutes / 60) * 80}
                      fill="url(#activityGradient)"
                      rx="4"
                    />
                    <line
                      x1="0"
                      y1="50"
                      x2="100"
                      y2="50"
                      stroke="#666"
                      strokeDasharray="2,2"
                      strokeWidth="1"
                    />
                    <text
                      x="50"
                      y="105"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="8"
                    >
                      30 min target
                    </text>
                  </svg>
                </div>
              )}
              <div style={{ 
                marginTop: 'auto',
                display: 'flex',
                gap: '0.5rem',
                flexDirection: 'column'
              }}>
                {key === 'sleep' ? (
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'row' }}>
                    <Button 
                      variant="secondary" 
                      size="small"
                      onClick={async () => {
                        try {
                          const { data: existingEntry } = await supabase
                            .from('sleep_entries')
                            .select('*')
                            .eq('user_id', user.id)
                            .eq('is_complete', false)
                            .single();

                          if (existingEntry) {
                            alert('You already have an active sleep session. Please log wake up first.');
                            return;
                          }

                          const entry = {
                            user_id: user.id,
                            start_time: new Date().toISOString(),
                            is_complete: false
                          };
                          
                          const { error } = await supabase
                            .from('sleep_entries')
                            .insert([entry]);
                            
                          if (error) throw error;
                          
                          alert('Sleep time logged! Sweet dreams! 😴');
                          await fetchStats();
                        } catch (err) {
                          console.error('Error logging sleep:', err);
                          alert('Failed to log sleep time. Please try again.');
                        }
                      }}
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'center',
                        flex: 1
                      }}
                    >
                      <span role="img" aria-label="going to bed">🛏️</span> Sleep
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="small"
                      onClick={async () => {
                        try {
                          const { data: lastEntry } = await supabase
                            .from('sleep_entries')
                            .select('*')
                            .eq('user_id', user.id)
                            .eq('is_complete', false)
                            .order('start_time', { ascending: false })
                            .limit(1)
                            .single();

                          if (!lastEntry) {
                            alert('No active sleep session found. Please log sleep time first.');
                            return;
                          }

                          const startTime = new Date(lastEntry.start_time);
                          const endTime = new Date();
                          const duration = (endTime - startTime) / (1000 * 60 * 60);

                          const { error } = await supabase
                            .from('sleep_entries')
                            .update({
                              end_time: endTime.toISOString(),
                              duration_hours: duration.toFixed(2),
                              is_complete: true,
                              quality: 'Good'
                            })
                            .eq('id', lastEntry.id);

                          if (error) throw error;

                          alert(`Good morning! You slept for ${duration.toFixed(1)} hours.`);
                          await fetchStats();
                        } catch (err) {
                          console.error('Error logging wake:', err);
                          alert('Failed to log wake up time. Please try again.');
                        }
                      }}
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'center',
                        flex: 1
                      }}
                    >
                      <span role="img" aria-label="woke up">🌅</span> Wake
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="secondary" 
                    size="small"
                    onClick={() => setActiveLogger(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      justifyContent: 'center'
                    }}
                  >
                    {action}
                  </Button>
                )}
              </div>
              {/* Add timeline button here */}
              <TimelineButton
                onClick={() => setTimelineView(key === 'calories' ? 'food' : key)}
                title={`View ${key === 'calories' ? 'food' : key} timeline`}
              >
                📊
              </TimelineButton>
              <Button
                variant="text"
                size="small"
                onClick={() => setTimelineView(key === 'calories' ? 'food' : key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  marginTop: '0.5rem',
                  opacity: 0.8
                }}
              >
                <span role="img" aria-label="timeline">📊</span> View History
              </Button>
            </StatCard>
          ))}
        </AnimatePresence>
      </DashboardContainer>

      {/* Logging Modals */}
      {(activeLogger === 'calories' || activeLogger === 'activity') && (
        <Modal onClose={() => setActiveLogger(null)}>
          {activeLogger === 'calories' ? (
            <FoodLogger onSuccess={() => {
              setActiveLogger(null);
              fetchStats();
            }} />
          ) : (
            <ActivityLogger onSuccess={() => {
              setActiveLogger(null);
              fetchStats();
            }} />
          )}
        </Modal>
      )}
      {activeLogger === 'sleep' && (
        <Modal onClose={() => setActiveLogger(null)}>
          <SleepTracker 
            onSuccess={() => setActiveLogger(null)}
            onUpdate={fetchStats} 
          />
        </Modal>
      )}
      {timelineView && (
        <Modal 
          onClose={() => setTimelineView(null)}
          fullWidth
        >
          <Timeline 
            type={timelineView === 'calories' ? 'food' : timelineView} // Change 'calories' to 'food'
            period={selectedPeriod}
            onClose={() => setTimelineView(null)}
            onUpdate={fetchStats}
          />
        </Modal>
      )}
    
    </div>
  );
}
