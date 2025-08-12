import { NextResponse } from 'next/server';
import { geminiModel } from '@/lib/gemini';
// removed cookies/auth usage to avoid bundling auth helpers and warnings

// Simple in-memory cache and rate limit (per process)
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RATE_WINDOW_MS = 60 * 1000; // 60s
const cache = new Map(); // key -> { payload, expires }
const rate = new Map(); // key -> lastTs

function buildKey({ stats, streak, periodLabel }) {
  try {
    return JSON.stringify({
      c: { c: stats?.calories?.consumed || 0, b: stats?.calories?.burned || 0, t: stats?.calories?.target || 0 },
      s: { h: Number(stats?.sleep?.hours || 0) },
      a: { m: stats?.activity?.minutes || 0 },
      k: streak || 0,
      p: periodLabel || 'Today'
    });
  } catch {
    return 'default';
  }
}

function localFallback(stats = {}, streak = 0, periodLabel = 'Today') {
  const net = Math.max(0, (stats?.calories?.consumed || 0) - (stats?.calories?.burned || 0));
  const target = stats?.calories?.target || 2000;
  const sleep = Number(stats?.sleep?.hours || 0);
  const mins = stats?.activity?.minutes || 0;
  let msg;
  let emoji = '✨';
  if (mins >= 30) { msg = 'Nice movement today—keep that streak alive.'; emoji = '💪'; }
  else if (sleep >= 8) { msg = 'Solid sleep—ride that energy into your goals.'; emoji = '😴'; }
  else if (net < target * 0.6) { msg = 'You’re pacing well—steady choices add up.'; emoji = '🌱'; }
  else { msg = 'Progress over perfection—one small win next.'; emoji = '⭐'; }
  if (streak >= 3) msg = `Streak ${streak} days—momentum looks great. ${msg}`;
  return { message: msg, tone: 'supportive', emoji };
}
// POST /api/motivation
// Body: { stats: { calories:{consumed, burned, target}, sleep:{hours}, activity:{minutes} }, streak: number }
export async function POST(req) {
  try {
    const { stats, streak, periodLabel } = await req.json();
    const key = buildKey({ stats, streak, periodLabel });

    // Rate limit (single global key; can extend to IP if needed)
    const now = Date.now();
    const last = rate.get('global') || 0;
    if (now - last < RATE_WINDOW_MS) {
      return NextResponse.json(localFallback(stats, streak, periodLabel));
    }

    // Cache
    const entry = cache.get(key);
    if (entry && entry.expires > now) {
      return NextResponse.json(entry.payload);
    }

    const prompt = `You are a friendly fitness coach. Write a very short, uplifting message (max 2 sentences) tailored to the user's day.
Inputs:
- Net calories: ${Math.max(0, (stats?.calories?.consumed || 0) - (stats?.calories?.burned || 0))}/${stats?.calories?.target || 2000}
- Sleep hours: ${stats?.sleep?.hours || 0}
- Activity minutes: ${stats?.activity?.minutes || 0}
- Streak days: ${streak || 0}
- Period: ${periodLabel || 'Today'}

Return ONLY compact JSON with keys: message (string), tone ("encouraging"|"celebratory"|"supportive"), emoji (one relevant emoji).
Example: {"message":"Nice work hitting your activity goal—just a light dinner keeps you on track.","tone":"encouraging","emoji":"💪"}`;

    let payload;
    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result?.response?.text?.() ?? '';
      const json = text.replace(/```json|```/g, '').trim();
      payload = JSON.parse(json);
    } catch (apiErr) {
      // Handle 429 specifically without noisy logs
      const msg = String(apiErr?.message || '');
      if (apiErr?.status === 429 || msg.includes('429') || msg.includes('Too Many Requests')) {
        payload = localFallback(stats, streak, periodLabel);
      } else {
        console.warn('Motivation API fallback due to error:', msg);
        payload = localFallback(stats, streak, periodLabel);
      }
    }

    // Update cache and rate limit
    cache.set(key, { payload, expires: now + CACHE_TTL_MS });
    rate.set('global', now);
    return NextResponse.json(payload);

  } catch (err) {
    // Total failure -> graceful fallback
    return NextResponse.json(localFallback(), { status: 200 });
  }
}
