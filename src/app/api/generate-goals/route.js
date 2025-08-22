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
      target_weight_change_kg,
      target_weeks,
    } = await req.json();

    let goalPrompt = `my goals is to ${goal}`;
    if (goal === 'lose_weight') {
      goalPrompt += ` ${target_weight_change_kg} kg in ${target_weeks} weeks`;
    } else if (goal === 'gain_weight') {
      goalPrompt += ` ${target_weight_change_kg} kg in ${target_weeks} weeks`;
    }

    const userInput = `My age is ${age}\n\nheight_ ${height} cm\nweight_ ${weight} kg\ngender ${gender}\nactivity_level - ${activity} minutes per week\n${goalPrompt}\n\n` +
    `suggest Personalized daily calorie target \nsuggest minutes of physical activity per week\nSuggested sleep target \n`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const promptContents = [
      {
        role: "user",
        parts: [
          {
            text: `My age is ${age}\n\nheight_ ${height} cm\nweight_ ${weight} kg\ngender ${gender}\nactivity_level - ${activity} minutes per week\nmy goals is to ${goal}${goal !== 'maintain_weight' ? ` ${target_weight_change_kg} kg in ${target_weeks} weeks` : ''}\n\nsuggest Personalized daily calorie target \nsuggest minutes of physical activity per week\nSuggested sleep target \n`
          },
        ]
      },
      {
        role: "model",
        parts: [
          {
            text: `**Defining Nutritional Strategies**\n\nI'm currently focused on formulating a personalized plan. Considering the user's age, height, weight, gender, and lifestyle, my primary goal is to provide specific, actionable nutritional strategies.\n\n**Revising Calorie Targets**\n\nI've refined the calorie target based on the initial assessment, calculating a Basal Metabolic Rate and Total Daily Energy Expenditure.\n\n**Refining Exercise Recommendations**\n\nI'm now detailing exercise recommendations.\n\n**Defining Recommendation Structure**\n\nI'm now focusing on formatting the data into a JSON structure for clarity.\n\n**Constructing the Output JSON**\n\nI'm now putting the finishing touches on the JSON.\n\n**Formulating the Final Output**\n\nMy final task now is to generate the JSON output, integrating all the recommendations.\n\n`
          },
          {
            text: `{
  "personalized_recommendations": {
    "daily_calorie_target": {
      "value": "1900-2100",
      "unit": "kcal",
      "notes": "This target creates a sustainable calorie deficit of approximately 300-500 kcal per day from your estimated maintenance calories, aiming for a weight loss of about 0.5 kg per week."
    },
    "physical_activity_per_week": {
      "aerobic": {
        "value": "150",
        "unit": "minutes",
        "intensity": "Moderate",
        "notes": "Start with 150 minutes of moderate-intensity aerobic activity, such as brisk walking, cycling, or swimming. This can be broken down into 30 minutes, 5 days a week. You can gradually increase this to 300 minutes per week for enhanced weight loss benefits."
      },
      "strength_training": {
        "value": "2",
        "unit": "sessions",
        "notes": "Incorporate at least two non-consecutive days of strength training targeting all major muscle groups. Building muscle mass helps increase your resting metabolic rate."
      }
    },
    "daily_sleep_target": {
      "value": "7-9",
      "unit": "hours",
      "notes": "Quality sleep is essential for regulating appetite hormones, improving recovery, and maintaining energy levels, which are all crucial for successful weight loss."
    },
    "disclaimer": "These are general recommendations based on the data provided. For a comprehensive and personalized plan, please consult with a healthcare professional, registered dietitian, or a certified personal trainer."
  }
}`
          },
        ]
      },
      {
        role: "user",
        parts: [
          {
            text: `My age is ${age}\n\nheight_ ${height} cm\nweight_ ${weight} kg\ngender ${gender}\nactivity_level - ${activity} minutes per week\nmy goals is to ${goal}${goal !== 'maintain_weight' ? ` ${target_weight_change_kg} kg in ${target_weeks} weeks` : ''}\n\nsuggest Personalized daily calorie target \nsuggest minutes of physical activity per week\nSuggested sleep target \n`
          },
        ]
      },
    ];

    const result = await model.generateContent({
      contents: promptContents,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    const text = await response.text();

    const jsonResponse = JSON.parse(text.replace(/```json|```/g, "").trim());

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
