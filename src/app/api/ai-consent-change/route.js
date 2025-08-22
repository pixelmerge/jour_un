import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, oldValue, newValue } = body || {};
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('ai_consent_audit')
      .insert([{ user_id: userId, old_value: oldValue, new_value: newValue, changed_by: userId }]);

    if (error) {
      console.error('Failed to insert ai_consent_audit:', error);
      return new Response(JSON.stringify({ error: 'db_error' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Unexpected error in ai-consent-change:', err);
    return new Response(JSON.stringify({ error: 'unexpected' }), { status: 500 });
  }
}
