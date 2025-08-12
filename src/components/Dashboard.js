import { useState, useEffect, useMemo, useRef } from 'react';
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
import LottieOverlay from './ui/LottieOverlay';
import Timeline from './ui/Timeline';

// Lightweight confetti burst using CSS circles (no new deps)
const Confetti = ({ trigger }) => (
  <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    {[...Array(10)].map((_, i) => (
      <span
        key={i}
        style={{
          position: 'absolute',
          left: `${10 + i * 8}%`,
          top: trigger ? '10%' : '-20%',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: ['#4CAF50','#FF7043','#7E57C2','#42A5F5','#FFC107'][i%5],
          transition: 'top 600ms ease, opacity 600ms ease',
          opacity: trigger ? 1 : 0
        }}
      />
    ))}
  </div>
);

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap; /* keep in one horizontal row on mobile */
  align-items: stretch;
  gap: 0.75rem;
  padding: 0.5rem 0 0.25rem;
  margin: 0 auto;

  /* Mobile: horizontal swipe */
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory; /* snap horizontally between cards */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: rgba(0,0,0,0.25) transparent;

  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0.15));
    border-radius: 999px;
  }
  &:hover::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.2));
  }

  /* Wide: show all three fully, no scroll */
  @media (min-width: 900px) {
    max-width: 900px;
    overflow-x: visible;
    scroll-snap-type: none;
    justify-content: space-between;
  }
`;

const Header = styled.header`
  background: ${props => props.theme.background.secondary};
  padding: 0.5rem 1rem; /* reduced to sit closer to nav */
  margin-bottom: 0.75rem; /* tighter spacing */
  border-bottom: 1px solid ${props => props.theme.border.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
`;

// Layout inside header: segment control on the left, refresh on the right
const HeaderRow = styled.div`
  display: flex;
  width: 100%;
  max-width: 900px;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
`;

const SegmentWrapper = styled.div`
  display: flex;
  gap: 0.25rem;
  background: ${props => props.theme.background.hover};
  padding: 0.25rem;
  border-radius: 10px;
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
  padding: 1rem;
  /* remove large fixed min-height to prevent big blank areas */
  scroll-snap-align: start;
  scroll-snap-stop: always; /* stronger snap behavior */

  /* Mobile card width: responsive clamp */
  flex: 0 0 auto;
  width: clamp(260px, 80vw, 320px);

  /* Wide: three equal columns with no overflow */
  @media (min-width: 900px) {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
  }

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

const DetailText = styled.div`
  color: ${props => props.theme.text.secondary};
`;

const RingLabel = styled.div`
  font-size: 12px;
  color: ${props => props.theme.text.secondary};
`;

const LogButton = styled(Button)`
  color: #ffffff; // Always white for contrast
  background: ${({ theme }) => theme.primaryButton.background};
  
  &:hover {
    background: ${({ theme }) => theme.primaryButton.hover};
  }
`;

// Refresh button removed per request

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streak, setStreak] = useState(0);
  // Motivation quote removed per request
  const [celebrate, setCelebrate] = useState(false);
  // Overlay for inline sleep actions
  const [animOpen, setAnimOpen] = useState(false);
  const [animCfg, setAnimCfg] = useState(null);

  // Period metadata used across UI and calculations
  const periodMeta = useMemo(() => ({
    today: { days: 1, label: 'Today' },
    week: { days: 7, label: 'Last 7 days' },
    month: { days: 30, label: 'Last 30 days' }
  }), []);

  const fetchStats = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const startDate = (() => {
      const now = new Date();
      switch (selectedPeriod) {
        case 'today':
          return startOfDay(now);
        case 'week':
          return startOfDay(subDays(now, 7));
        case 'month':
          return startOfDay(subDays(now, 30));
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

      // Fetch activity entries (sorted for recent type)
      const { data: activityData } = await supabase
        .from('activity_entries')
        .select('calories_burned, duration_minutes, activity_type, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Fetch sleep entries (completed only)
      const { data: sleepData } = await supabase
        .from('sleep_entries')
        .select('duration_hours, quality, start_time')
        .eq('user_id', user.id)
        .eq('is_complete', true)
        .gte('start_time', startDate.toISOString())
        .order('start_time', { ascending: false });

      // Days in the selected period (1, 7, 30)
      const { days } = periodMeta[selectedPeriod] || { days: 1 };

      const totalCaloriesConsumed =
        foodData?.reduce((sum, entry) => sum + Number(entry.calories || 0), 0) || 0;
      const totalCaloriesBurned =
        activityData?.reduce((sum, entry) => sum + Number(entry.calories_burned || 0), 0) || 0;
      const totalActivityMinutes =
        activityData?.reduce((sum, entry) => sum + Number(entry.duration_minutes || 0), 0) || 0;

      // Sleep: sum hours over the period, then average per day (not per entry)
      const totalSleepHours =
        sleepData?.reduce((sum, entry) => sum + Number(entry.duration_hours || 0), 0) || 0;
      const avgSleepHoursPerDay = days > 0 ? Number((totalSleepHours / days).toFixed(1)) : 0;
      const latestSleepQuality = sleepData?.[0]?.quality || 'N/A';

      // Compute period-based targets
      const caloriesPerDayTarget = 2000; // TODO: user-specific
      const periodCalorieTarget = caloriesPerDayTarget * days;

      setStats({
        calories: { consumed: totalCaloriesConsumed, burned: totalCaloriesBurned, target: periodCalorieTarget },
        sleep: { hours: avgSleepHoursPerDay, quality: latestSleepQuality },
        activity: { minutes: totalActivityMinutes, type: activityData?.[0]?.activity_type || 'None' }
      });

      // Compute simple streak: consecutive days with at least one log in any category
      try {
        const todayStart = startOfDay(new Date()).toISOString();
        const { data: recentFood } = await supabase
          .from('food_entries')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', subDays(new Date(), 30).toISOString())
          .order('created_at', { ascending: false });
        const { data: recentAct } = await supabase
          .from('activity_entries')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', subDays(new Date(), 30).toISOString());
        const { data: recentSleep } = await supabase
          .from('sleep_entries')
          .select('start_time')
          .eq('user_id', user.id)
          .gte('start_time', subDays(new Date(), 30).toISOString());

        const dates = new Set([
          ...(recentFood||[]).map(r => new Date(r.created_at).toDateString()),
          ...(recentAct||[]).map(r => new Date(r.created_at).toDateString()),
          ...(recentSleep||[]).map(r => new Date(r.start_time).toDateString()),
        ]);

        let s = 0;
        for (let i = 0; i < 30; i++) {
          const d = subDays(new Date(), i).toDateString();
          if (dates.has(d)) s++; else break;
        }
        setStreak(s);
      } catch (e) {
        // Non-blocking
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, selectedPeriod]);

  // Trigger a small celebration if any goal hits >= 100% for today
  useEffect(() => {
    if (!user) return;
    if (selectedPeriod === 'today' && ((stats.activity.minutes >= 30) || (stats.calories.consumed >= stats.calories.target) || (Number(stats.sleep.hours) >= 8))) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 900);
    }
  }, [user, selectedPeriod, stats.activity.minutes, stats.calories.consumed, stats.calories.target, stats.sleep.hours]);

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
      
  // Play sleep animation instead of alert
  setAnimCfg({ path: '/animations/sleep.json', initialSegment: [0, 90], speed: 0.5, durationMs: 3000 });
  setAnimOpen(true);
      await fetchStats();
    } catch (err) {
      console.error('Error logging sleep:', err);
      alert('Failed to log sleep time. Please try again.');
    }
  };

  const { days, label: periodLabel } = periodMeta[selectedPeriod] || { days: 1, label: 'Today' };

  return (
    <div>
      <Header>
        <HeaderRow>
          <SegmentWrapper>
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
          </SegmentWrapper>

          {/* Refresh button removed */}
        </HeaderRow>
        {error && (
          <div style={{
            color: '#ff6b6b',
            fontSize: '0.875rem',
            marginTop: '0.75rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </Header>

      {/* Hero progress card */}
      <div style={{ maxWidth: 900, margin: '0 auto 1rem', position: 'relative' }}>
        <Card as={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: 24 }}>🔥</div>
              <div>
                <div style={{ fontSize: 14, color: 'inherit', opacity: 0.8 }}>{periodMeta[selectedPeriod]?.label || 'Today'}</div>
                <div style={{ fontWeight: 700 }}>Streak: {streak} day{streak===1?'':'s'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              {/* compact rings */}
              {['Calories','Sleep','Activity'].map((t, i) => {
                const days = (periodMeta[selectedPeriod] || { days: 1 }).days;
                const perDayActivity =
                  selectedPeriod === 'today'
                    ? Number(stats.activity.minutes || 0)
                    : Number(stats.activity.minutes || 0) / Math.max(1, days);
                // Sleep.hours is already per-day average from fetchStats
                const perDaySleep = Number(stats.sleep.hours || 0);
                const pct = {
                  Calories: Math.min(100, Math.round((Number(stats.calories.consumed || 0) / Math.max(1, Number(stats.calories.target || 0))) * 100)),
                  Sleep: Math.min(100, Math.round((perDaySleep / 8) * 100)),
                  Activity: Math.min(100, Math.round((perDayActivity / 30) * 100)),
                }[t];
                const circumference = 2 * Math.PI * 18;
                return (
                  <div key={t} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <svg width="48" height="48" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="18" stroke="#eee" strokeWidth="6" fill="none" />
                      <circle
                        cx="24" cy="24" r="18"
                        stroke={['#4CAF50','#7E57C2','#FF7043'][i]}
                        strokeWidth="6" fill="none"
                        strokeDasharray={`${(pct/100)*circumference} ${circumference}`}
                        transform="rotate(-90 24 24)"
                        style={{ transition: 'stroke-dasharray 300ms' }}
                      />
                      <text x="24" y="27" fontSize="10" textAnchor="middle" fill="currentColor">{pct}%</text>
                    </svg>
                    <RingLabel>{t}</RingLabel>
                  </div>
                );
              })}
            </div>
            {/* Motivation quote removed */}
          </div>
          <Confetti trigger={celebrate} />
        </Card>
      </div>

      <DashboardContainer>
        <AnimatePresence mode="popLayout">
          {[
            {
              key: 'calories',
              label: `Calories • ${periodLabel}`,
              value: Math.max(0, stats.calories.target - stats.calories.consumed),
              detail: `${stats.calories.consumed} consumed • ${Math.max(0, stats.calories.target - stats.calories.consumed)} remaining • target ${stats.calories.target}`,
              action: '🍽️ Log Meal',
              delay: 0
            },
            {
              key: 'sleep',
              label: `Sleep • ${selectedPeriod === 'today' ? 'Today' : 'Avg per day'}`,
              value: `${stats.sleep.hours}hrs`,
              detail: `Quality: ${stats.sleep.quality}`,
              action: '😴 Log Sleep',
              delay: 0.1
            },
            {
              key: 'activity',
              label: `Activity • ${selectedPeriod === 'today' ? 'Today' : 'Avg per day'}`,
              value: `${selectedPeriod === 'today' ? stats.activity.minutes : Math.round(stats.activity.minutes / days)}min${selectedPeriod === 'today' ? '' : '/day'}`,
              detail: `${selectedPeriod === 'today' ? 'Type' : 'Recent'}: ${stats.activity.type} • ${stats.calories.burned} cal burned`,
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
              <DetailText>{detail}</DetailText>
              <div style={{ 
                marginTop: '0.5rem',
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
                          
                          // Play sleep animation instead of alert
                          setAnimCfg({ path: '/animations/sleep.json', initialSegment: [0, 90], speed: 0.5, durationMs: 3000 });
                          setAnimOpen(true);
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

                          // Play wake animation instead of alert
                          setAnimCfg({ path: '/animations/wake.json', fallbackPath: '/animations/sleep.json', initialSegment: [380, 480], speed: 0.5, durationMs: 3000 });
                          setAnimOpen(true);
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
              // Allow the post-save animation to play for ~3 seconds
              fetchStats();
              setTimeout(() => setActiveLogger(null), 3000);
            }} />
          ) : (
            <ActivityLogger onSuccess={() => {
              fetchStats();
              setTimeout(() => setActiveLogger(null), 3000);
            }} />
          )}
        </Modal>
      )}
      {activeLogger === 'sleep' && (
        <Modal onClose={() => setActiveLogger(null)}>
          <SleepTracker 
            onSuccess={() => { /* keep modal open to let animation finish */ }}
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
    
      {/* Global overlay for inline sleep actions */}
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

    </div>
  );
}
