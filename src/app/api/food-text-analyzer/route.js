import { NextResponse } from 'next/server';
import { generateFoodAnalysisFromText } from '@/lib/gemini';

export async function POST(req) {
  try {
    const { description } = await req.json();

    if (!description) {
      return NextResponse.json({ success: false, error: 'Food description is required' }, { status: 400 });
    }

    const analysis = await generateFoodAnalysisFromText(description);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Error in food-text-analyzer route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to analyze food description' }, { status: 500 });
  }
}
