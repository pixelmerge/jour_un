import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// First, validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.GEMINI_API_KEY) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function callGeminiAPI(description, userProfile) {
  const promptText = `Analyze the activity description and user profile.
User Profile:
- Age: ${userProfile.age}
- Height: ${userProfile.height_cm} cm
- Weight: ${userProfile.weight_kg} kg
- Gender: ${userProfile.gender}
Activity Description: "${description}"

Based on the data, perform the following:
1. Identify the specific activity (e.g., "running", "swimming").
2. Estimate the duration in minutes from the description.
3. Estimate the Metabolic Equivalent of Task (MET) value for the identified activity.
4. Return ONLY a single, valid JSON object with the following exact structure:
{
  "activity": "string",
  "duration_minutes": number,
  "metValue": number
}
Do not include any markdown formatting, backticks, or any text outside of the JSON object.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{
              text: promptText
            }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1000,
        }
      })
    }
  );

  const data = await response.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('Invalid or empty response structure from Gemini API:', JSON.stringify(data, null, 2));
    throw new Error('Invalid response from Gemini API');
  }

  // Clean the response text to handle potential markdown formatting from Gemini
  const rawText = data.candidates[0].content.parts[0].text;
  const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    // Parse the cleaned JSON response from Gemini's text output
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse cleaned Gemini response as JSON:", cleanedText);
    throw new Error('Could not parse JSON from Gemini response.');
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { description, userId } = body;

    if (!description?.trim() || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required data'
      }, { status: 400 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('age, height_cm, weight_kg, gender, activity_level')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile'
      }, { status: 500 });
    }

    // If no profile exists, return error
    if (!userProfile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found'
      }, { status: 404 });
    }

    const analysis = await callGeminiAPI(description, userProfile);

    // Perform calculation in the backend for accuracy and consistency
    const caloriesBurned = Math.round(
      (analysis.duration_minutes * (analysis.metValue * 3.5 * userProfile.weight_kg)) / 200
    );
    const formula = "Duration (min) * (MET * 3.5 * Weight (kg)) / 200";

    return NextResponse.json({ 
      success: true, 
      output: {
        activity: analysis.activity,
        duration_minutes: analysis.duration_minutes,
        estimated_calories_burned: caloriesBurned,
        intensity_level: analysis.metValue > 6 ? "high" : 
                        analysis.metValue > 3 ? "moderate" : "low",
        disclaimer: "This is an estimate based on your profile data",
        calculation_details: {
          metValue: analysis.metValue,
          formula: formula
        }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}