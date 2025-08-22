// Server-only environment helpers
// Import from server API routes only. Do NOT import this in client code.

export function requireServerEnv(varName) {
  const v = process.env[varName];
  if (!v) {
    throw new Error(`Missing required server environment variable: ${varName}`);
  }
  return v;
}

export function getServerEnv() {
  return {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || null,
    geminiApiKey: process.env.GEMINI_API_KEY || null
  };
}
