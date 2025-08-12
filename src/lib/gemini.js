import { GoogleGenerativeAI } from '@google/generative-ai';

// Validate API key presence
if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelConfig = {
  generationConfig: {
    temperature: 0.4,
    topP: 1,
    topK: 32,
    maxOutputTokens: 4096,
  }
};

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash-latest'
});

export async function generateActivityAnalysis(description, userProfile) {
  try {
    // Build profile data string only with present values
    const profileData = [];
    if (userProfile?.age) profileData.push(`Age: ${userProfile.age} years`);
    if (userProfile?.height_cm) profileData.push(`Height: ${userProfile.height_cm} cm`);
    if (userProfile?.weight_kg) profileData.push(`Weight: ${userProfile.weight_kg} kg`);
    if (userProfile?.gender) profileData.push(`Gender: ${userProfile.gender}`);

    console.log('Available profile data:', profileData);

    const prompt = [{
      role: "user",
      parts: [{
        text: `Analyze this physical activity and calculate calories burned.
${profileData.length > 0 ? '\nUser Profile:\n' + profileData.map(data => `- ${data}`).join('\n') : ''}

Activity Description: ${description}

Return ONLY a JSON object in this exact format:
{
  "activity": "name of activity",
  "durationInMinutes": number,
  "estimatedCaloriesBurned": number,
  "calculation": {
    "metValue": number,
    "formula": "calculation explanation"
  }
}`
      }]
    }];

    console.log('Sending prompt to Gemini:', JSON.stringify(prompt, null, 2));

    const result = await geminiModel.generateContent(prompt);
    
    if (!result?.response) {
      throw new Error('No response received from Gemini');
    }

    const responseText = result.response.text();
    console.log('Raw Gemini response:', responseText);

    // Clean and parse JSON response
    const cleanText = responseText.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanText);

    return parsedData;

  } catch (error) {
    console.error('Activity analysis error:', error.message);
    throw new Error(`Failed to analyze activity: ${error.message}`);
  }
}

export async function generateFoodAnalysisFromText(description) {
  try {
    const prompt = `Analyze the following food description and return a structured JSON object with estimated nutritional information. The description is: "${description}".

Return ONLY a JSON object in this exact format:
{
  "food_name": "a concise and descriptive name for the meal",
  "calories": number,
  "portion_size": "e.g., 1 bowl, 2 slices, 100g",
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number
}`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error generating food analysis from text:', error);
    throw new Error('Failed to analyze food description.');
  }
}

export async function generateFoodAnalysis(image_data, image_type, user_comment = '') {
  try {
    const prompt = [
      {
        text: `Analyze the food in this image. ${user_comment ? `The user added this comment: "${user_comment}". Use this comment to improve the analysis.` : ''}
        Return ONLY a JSON object in this exact format:
        {
          "food_name": "name of the food",
          "calories": number,
          "portion_size": "e.g., 1 bowl, 2 slices, 100g",
          "protein_g": number,
          "carbs_g": number,
          "fat_g": number
        }`
      },
      {
        inline_data: {
          mime_type: image_type,
          data: image_data.split(',')[1]
        }
      }
    ];

    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: prompt }],
      ...modelConfig
    });
    
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);

  } catch (error) {
    console.error('Food analysis error:', error);
    throw new Error(`Failed to analyze food image: ${error.message}`);
  }
}