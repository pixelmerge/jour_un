import { NextResponse } from 'next/server';
import { geminiModel } from '@/lib/gemini';
import { supabase } from '@/lib/supabaseClient';
import { headers } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req) {
  const { foodDescription } = await req.json(); // Or handle image data
  const supabase = createServerComponentClient({ cookies });

  try {
    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch user's profile (goals) and recent entries
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('physical_goal, nutrition_goal, activity_goal')
      .eq('id', user.id)
      .single();

    // In a real app, you'd fetch recent food/activity entries too.
    // For this example, we'll just use goals.

    // 3. Construct a detailed prompt for Gemini
    const prompt = `
      A user is asking if they should eat "${foodDescription}".
      
      Here is their context:
      - Nutrition Goal: "${profile.nutrition_goal}"
      - Physical Goal: "${profile.physical_goal}"
      - Activity Goal: "${profile.activity_goal}"
      
      Based on this context, please perform the following analysis:
      1. Grade the food from A (ideal) to F (not recommended).
      2. Provide a short title for your recommendation (e.g., "A Good Choice!", "Consider Alternatives", "Best Avoided").
      3. Explain your reasoning in one or two sentences.
      4. Suggest 1-2 healthier alternatives.
      
      Return the response as a valid JSON object with the following keys:
      "grade", "title", "reasoning", "alternatives".
      
      Example response:
      {
        "grade": "D",
        "title": "High in Calories, Low in Nutrients",
        "reasoning": "This food is high in processed fats and sugars, which doesn't align with your goal of reducing sugar intake.",
        "alternatives": "A grilled chicken salad or a homemade whole-wheat wrap would be a more balanced choice."
      }
    `;

    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const jsonString = text.replace(/```json|```/g, '').trim();
    const dataObject = JSON.parse(jsonString);

    return NextResponse.json(dataObject);

  } catch (error) {
    console.error('Error in should-i-eat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}