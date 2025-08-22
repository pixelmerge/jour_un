// Robust JSON extraction from LLM responses.
// Tries to find the first JSON object in a string, strips fences, and returns parsed object or throws with context.

export function extractFirstJson(text) {
  if (!text || typeof text !== 'string') throw new Error('No text to parse');

  // Remove common fences and code block markers
  let cleaned = text.replace(/```(?:json)?/gi, '').trim();

  // Attempt to find {...} block
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    // Try to extract a JSON-like substring with regex for safety
    const match = cleaned.match(/(\{[\s\S]*\})/);
    if (!match) throw new Error('No JSON object found in response');
    cleaned = match[1];
  } else {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Provide additional context for debugging
    const snippet = cleaned.slice(0, 1000);
    const message = `Failed to parse JSON from AI response. Error: ${err.message}. Snippet: ${snippet}`;
    const e = new Error(message);
    e.cause = err;
    throw e;
  }
}
