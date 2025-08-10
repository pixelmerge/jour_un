import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function to convert base64 to Google Generative AI Part object
function fileToGenerativePart(base64String, mimeType) {
  // Remove the 'data:image/jpeg;base64,' prefix if present
  const base64WithoutPrefix = base64String.split(',')[1] || base64String;
  return {
    inlineData: {
      data: base64WithoutPrefix,
      mimeType
    },
  };
}

export async function POST(request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    const { image_data, image_type } = await request.json();

    if (!image_data || !image_type) {
      return NextResponse.json({ success: false, error: 'Missing image data or type' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use the latest flash model and enforce a JSON response
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const imagePart = fileToGenerativePart(image_data, image_type);

    const prompt = `Analyze this food image and provide the following estimated nutritional information as a JSON object: food name (approximate), total estimated calories, estimated portion size (e.g., '1 serving', 'small plate'), estimated protein in grams, estimated carbohydrates in grams, and estimated fat in grams. If you cannot identify the food or its nutritional value, return default or null values for numerical fields. Do not include any other text, markdown, or formatting besides the single JSON object.

Example JSON format: {"food_name": "Chicken Salad", "calories": 350, "portion_size": "1 bowl", "protein_g": 30, "carbs_g": 15, "fat_g": 20}`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // The model is instructed to return JSON, so we can parse the text directly.
    const parsedResponse = JSON.parse(text);
    
    return NextResponse.json({ success: true, analysis: parsedResponse });

  } catch (error) {
    console.error('Error in /api/food-analyzer:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Error analyzing food image';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}