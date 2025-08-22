import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireServerEnv } from '@/lib/serverEnv';
import { extractFirstJson } from '@/lib/aiResponseParser';

// Do not validate env at module load to avoid crashing during local dev tooling.

async function callGeminiAPI(description, userProfile, geminiKey) {
  const promptText = `Analyze the activity description and user profile.\nUser Profile:\n${userProfile?.age ? `- Age: ${userProfile.age}\n` : ''}${userProfile?.height_cm ? `- Height: ${userProfile.height_cm} cm\n` : ''}${userProfile?.weight_kg ? `- Weight: ${userProfile.weight_kg} kg\n` : ''}${userProfile?.gender ? `- Gender: ${userProfile.gender}\n` : ''}${userProfile?.activity_goal ? `- Activity Goal: ${userProfile.activity_goal}\n` : ''}Activity Description: "${description}"\n\nBased on the data, perform the following:\n1. Identify the specific activity (e.g., \"running\", \"swimming\").\n2. Estimate the duration in minutes from the description.\n3. Estimate the Metabolic Equivalent of Task (MET) value for the identified activity.\n4. Return ONLY a single, valid JSON object with the following exact structure:\n{\n  \"activity\": \"string\",\n  \"duration_minutes\": number,\n  \"metValue\": number\n}\nDo not include any markdown formatting, backticks, or any text outside of the JSON object.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${encodeURIComponent(geminiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: promptText }] }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1000
      }
    })
  });

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    console.error('Invalid response from Gemini:', JSON.stringify(data, null, 2));
    throw new Error('Invalid response from Gemini API');
  }

  // Use centralized parser to extract the JSON
  return extractFirstJson(rawText);
}

// derive BMR and targets
function deriveTargets({ age, height_cm, weight_kg, gender, activity_goal }, weightKg) {
  // BMR (Mifflin-St Jeor)
  const w = weightKg ?? weight_kg ?? 70;
  const h = height_cm ?? 170;
  const a = typeof age === 'number' ? age : 30;
  let bmr = 2000;
  if (gender) {
    const g = String(gender).toLowerCase();
    if (g.startsWith('m')) {
      bmr = Math.round(10 * w + 6.25 * h - 5 * a + 5);
    } else if (g.startsWith('f')) {
      bmr = Math.round(10 * w + 6.25 * h - 5 * a - 161);
    }
  } else {
    // fallback estimate
    bmr = Math.round(10 * w + 6.25 * h - 5 * a + 0);
  }

  // Map activity_goal to activity level multiplier
  const activityMap = {
    'lose weight': 1.2,
    'maintain weight': 1.375,
    'gain muscle': 1.55,
    'increase endurance': 1.725,
    'high performance': 1.9
  };
  
  // Try to derive from activity_goal, otherwise use moderate default
  let factor = 1.375; // default to moderately active
  if (activity_goal) {
    const goalLower = String(activity_goal).toLowerCase();
    factor = activityMap[goalLower] ?? 1.375;
  }
  
  const tdee = Math.round(bmr * factor);

  // simple default activity & sleep targets (can be customized later)
  const activityMinutesTarget = 210; // default weekly (30 min x 7 days)
  const sleepHoursTarget = 8;

  return {
    derived_daily_calorie_target: tdee,
    derived_activity_minutes_target: activityMinutesTarget,
    derived_sleep_target_hours: sleepHoursTarget,
    derived_bmr: bmr,
    derived_activity_factor: factor
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { description, userId } = body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ success: false, error: 'Invalid or missing description' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    // Server-only envs
    const supabaseServiceKey = requireServerEnv('SUPABASE_SERVICE_KEY');
    const geminiKey = requireServerEnv('GEMINI_API_KEY');
    const supabaseUrl = requireServerEnv('NEXT_PUBLIC_SUPABASE_URL');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, age, height_cm, weight_kg, gender, ai_consent, daily_calorie_target, activity_minutes_target, sleep_target_hours, activity_goal')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ success: false, error: 'Failed to fetch user profile' }, { status: 500 });
    }

    if (!userProfile) {
      console.log('User profile not found for userId:', userId);
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    console.log('User profile found:', { 
      id: userProfile.id, 
      age: userProfile.age, 
      ai_consent: userProfile.ai_consent,
      hasWeight: !!userProfile.weight_kg 
    });

    // Respect AI consent: allow processing if consent is true or null/undefined (default to allowed for now)
    if (userProfile.ai_consent === false) {
      console.log('AI consent denied for user:', userId);
      return NextResponse.json({ success: false, error: 'User has not consented to AI processing' }, { status: 403 });
    }

    // Prefer the latest weight from a weight history table if available
    let preferredWeightKg = null;
    try {
      const { data: weightRow, error: weightError } = await supabase
        .from('weight_history')
        .select('weight_kg, weight_lb, recorded_at')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (!weightError && weightRow) {
        if (weightRow.weight_kg) preferredWeightKg = weightRow.weight_kg;
        else if (weightRow.weight_lb) preferredWeightKg = Number(weightRow.weight_lb) * 0.453592;
      }
    } catch (e) {
      // table may not exist — ignore and fall back to profile weight
      console.warn('weight_history read skipped or failed:', e?.message || e);
    }

    // Handle weight from profile (no weight_lb field in current schema)
    let weightFromProfileKg = null;
    if (userProfile.weight_kg) {
      weightFromProfileKg = Number(userProfile.weight_kg);
    }
    const finalWeightKg = preferredWeightKg ?? weightFromProfileKg ?? 70;

    // derive and persist targets if missing
    const targets = deriveTargets(userProfile, finalWeightKg);
    try {
      // Update user_profiles with derived fields if not present (only if they don't exist)
      const updateData = {};
      if (!userProfile.daily_calorie_target) updateData.daily_calorie_target = targets.derived_daily_calorie_target;
      if (!userProfile.activity_minutes_target) updateData.activity_minutes_target = targets.derived_activity_minutes_target;
      if (!userProfile.sleep_target_hours) updateData.sleep_target_hours = targets.derived_sleep_target_hours;
      
      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('user_profiles')
          .update(updateData, { returning: 'minimal' })
          .eq('id', userId);
      }
    } catch (e) {
      console.warn('Failed to persist derived targets:', e?.message || e);
      // non-fatal; continue
    }

    const analysis = await callGeminiAPI(description, userProfile, geminiKey);

    // Ensure expected numeric fields exist
    const duration = Number(analysis.duration_minutes ?? analysis.durationInMinutes ?? 0);
    const met = Number(analysis.metValue ?? analysis.met_value ?? analysis.met ?? 0);
    if (!duration || !met) {
      return NextResponse.json({ success: false, error: 'AI returned incomplete analysis' }, { status: 502 });
    }

    const caloriesBurned = Math.round((duration * (met * 3.5 * finalWeightKg)) / 200);
    const formula = 'Duration (min) * (MET * 3.5 * Weight (kg)) / 200';

    return NextResponse.json({
      success: true,
      output: {
        activity: analysis.activity || analysis.activity_name || 'unknown',
        duration_minutes: duration,
        estimated_calories_burned: caloriesBurned,
        intensity_level: met > 6 ? 'high' : met > 3 ? 'moderate' : 'low',
        disclaimer: 'This is an estimate based on your profile data',
        calculation_details: { metValue: met, formula }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}