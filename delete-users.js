const fetch = require('node-fetch');

const SUPABASE_URL = 'https://raudmfcorzxjydugaqde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdWRtZmNvcnp4anlkdWdhcWRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDczODc4MywiZXhwIjoyMDcwMzE0NzgzfQ.WxY78pqrng3deB0TgnAfSqpGW_xbxqUmCiZZKCVSiAI';

const USER_IDS = [
  '36c7b308-3439-4406-8282-a471f162cd8b',
  'bfc28b49-7f68-4513-b973-5c755203a026',
  '7af62c34-fb32-4a7c-944a-ceb890c87187',
  'a6a28d3f-2595-4038-ad1d-13dc0764097d'
];

async function deleteUser(userId) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  if (res.ok) {
    console.log(`User ${userId} deleted from auth.users`);
  } else {
    console.error(`Failed to delete user ${userId}:`, await res.text());
  }
}

(async () => {
  for (const userId of USER_IDS) {
    await deleteUser(userId);
  }
  console.log('All delete requests sent. Now run the SQL cleanup in Supabase.');
})();
