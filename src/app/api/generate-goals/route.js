import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const {
      weight,
      height,
      age,
      gender,
      activity,
      sleep,
      goal,
    } = await req.json();

    const prompt = `
      Based on the following user data, generate personalized health and fitness goals.
      - Weight: ${weight} kg
      - Height: ${height} cm
      - Age: ${age} years
      - Gender: ${gender}
      - Weekly Activity: ${activity} minutes
      - Nightly Sleep: ${sleep} hours
      - Primary Goal: ${goal}

      Provide a response in JSON format with the following keys:
      - "calories": Suggested daily calorie intake (integer).
      - "protein": Suggested daily protein intake in grams (integer).
      - "carbs": Suggested daily carbohydrate intake in grams (integer).
      - "fat": Suggested daily fat intake in grams (integer).
      - "activity": Suggested daily activity in minutes (integer).
      - "sleep": Suggested nightly sleep in hours (float).
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Clean the response to ensure it's valid JSON
    const jsonResponse = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());

    return new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating goals:", error);
    return new Response(JSON.stringify({ error: "Failed to generate goals" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
