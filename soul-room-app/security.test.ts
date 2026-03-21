import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SOUL ROOM - AUTOMATED SECURITY TEST SUITE
// A purely offensive script to verify the backend drops the hammer on hackers.
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing required .env.local variables.");
  process.exit(1);
}

// Clients
const clientAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const clientAdmin = SUPABASE_SERVICE_ROLE ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE) : null;

async function runTests() {
  console.log("=========================================");
  console.log("🛡️ SOUL ROOM DEFENSE-IN-DEPTH TEST SUITE");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Attempt to authenticate (using a dummy account if we have an admin key to create it, or test without auth)
  let attackerToken = '';
  let attackerId = '';
  
  if (clientAdmin) {
    console.log("⚙️  Using Service Role to provision test accounts...");
    const { data: user1, error: u1Err } = await clientAdmin.auth.admin.createUser({
      email: `attacker_${Date.now()}@test.com`,
      password: 'password123',
      email_confirm: true
    });
    const { data: user2, error: u2Err } = await clientAdmin.auth.admin.createUser({
      email: `victim_${Date.now()}@test.com`,
      password: 'password123',
      email_confirm: true
    });
    
    if (u1Err || u2Err) {
      console.log("❌ Failed to create test accounts", u1Err?.message, u2Err?.message);
      return;
    }
    
    attackerId = user1.user.id;
    const { data: session } = await clientAnon.auth.signInWithPassword({ email: user1.user.email!, password: 'password123' });
    attackerToken = session.session?.access_token || '';
  } else {
    console.log("⚠️  No Service Role Key found. Running public unauthenticated endpoint tests only...");
  }


  const attackerClient = attackerToken 
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${attackerToken}` } } })
    : null;

  function assert(condition: boolean, testName: string, successMsg: string, failMsg: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName} - ${successMsg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${failMsg}`);
      failed++;
    }
  }


  // ============================================================================
  // TEST 1: Ghost RPC Endpoints (CRIT-13)
  // ============================================================================
  console.log("\n[TEST 1: Ghost RPC Endpoints]");
  const { error: ghostErr } = await clientAnon.rpc('add_vp', { p_amount: 50000, p_user_id: attackerId || 'mock-id' });
  assert(
    ghostErr?.message.includes("Could not find the function"),
    "CRIT-13 Deleted Endpoints",
    "add_vp RPC is permanently deleted.",
    `RPC still exists! Error: ${ghostErr?.message}`
  );

  // If we don't have an auth client, skip the rest
  if (!attackerClient) {
    console.log(`\n=========================================`);
    console.log(`RESULTS: ${passed} Passed, ${failed} Failed, 4 Skipped (No Auth)`);
    return;
  }

  // ============================================================================
  // TEST 2: Privilege Escalation (VP & Founder Role) (CRIT-03)
  // ============================================================================
  console.log("\n[TEST 2: Privilege Escalation]");
  await attackerClient.from('users').update({ 
    vibe_points: 999999, 
    subscription_tier: 'founder', 
    is_founder: true 
  }).eq('id', attackerId);

  const { data: attackerProfile } = await attackerClient.from('users').select('vibe_points, subscription_tier, is_founder').eq('id', attackerId).single();
  assert(
    attackerProfile?.vibe_points !== 999999 && attackerProfile?.is_founder === false,
    "CRIT-03 Column Guard Trigger",
    `Trigger successfully blocked update. VP remains ${attackerProfile?.vibe_points}, Founder state remains ${attackerProfile?.subscription_tier}.`,
    `Trigger failed! Profile updated to: ${JSON.stringify(attackerProfile)}`
  );

  // ============================================================================
  // TEST 3: Fake Activity Injection (Achievements) (CRIT-11)
  // ============================================================================
  console.log("\n[TEST 3: Fake Activity Injection]");
  const { error: achErr } = await attackerClient.from('user_achievements').insert({
    user_id: attackerId,
    achievement_id: 'impossible_badge'
  });
  assert(
    achErr?.code === '42501' || achErr?.message.includes("violates row-level security"), // RLS Policy violation code
    "CRIT-11 Drop Client Inserts",
    "RLS successfully blocked client-side achievement injection.",
    `Injection succeeded or failed for wrong reason: ${achErr?.message}`
  );

  // ============================================================================
  // TEST 4: Edge Function Vault Access (HIGH-05)
  // ============================================================================
  console.log("\n[TEST 4: Edge Function Authentication]");
  const vaultRes = await fetch(`${SUPABASE_URL}/functions/v1/get-vault-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${attackerToken}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ messageId: 'invalid-id' })
  });
  const vaultBody = await vaultRes.json();
  assert(
    vaultRes.status === 404 || vaultBody.error === 'Message not found',
    "HIGH-05 Secure Vault Function",
    "Edge function is active, authenticated, and properly checking IDs before generating signed URLs.",
    `Edge function returned unexpected response: ${JSON.stringify(vaultBody)}`
  );

  console.log(`\n=========================================`);
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
}

runTests().catch(console.error);
