import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @deno-types="npm:agora-token@2"
import { RtcTokenBuilder, RtcRole } from 'npm:agora-token@2';

// Restrict CORS to known origins (update with your actual domains)
const ALLOWED_ORIGINS = [
  'https://soul-room.vercel.app',
  'https://soulroom.app',
  'capacitor://localhost',
  'http://localhost:3000', // dev only
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

serve(async (req: Request) => {
  const CORS = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── 1. Authenticate the caller ──────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // Use service role for DB lookups
    );

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
    }

    // ── 2. Parse and validate input ─────────────────────────────────
    const { channelName, role } = await req.json();
    if (!channelName || !role) {
      return new Response(JSON.stringify({ error: 'Missing channelName or role' }), { status: 400, headers: CORS });
    }

    if (!['host', 'audience'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400, headers: CORS });
    }

    // ── 3. Verify room membership ───────────────────────────────────
    // channelName format is the room UUID
    const { data: participant, error: partError } = await supabaseAdmin
      .from('room_participants')
      .select('role')
      .eq('room_id', channelName)
      .eq('user_id', user.id)
      .single();

    if (partError || !participant) {
      return new Response(JSON.stringify({ error: 'Not a participant of this room' }), { status: 403, headers: CORS });
    }

    // ── 4. Derive UID server-side (not from client) ─────────────────
    // Use a stable hash of user.id with larger space (0 to 2^31-1)
    let uid = 0;
    for (let i = 0; i < user.id.length; i++) {
      uid = ((uid * 31) + user.id.charCodeAt(i)) | 0;
    }
    uid = Math.abs(uid) % 2_147_483_647; // Max Agora UID range
    if (uid === 0) uid = 1; // Agora UID 0 means "auto-assign", avoid it

    // ── 5. Determine Agora role from DB participant role ─────────────
    // Only hosts and speakers get PUBLISHER rights; listeners are SUBSCRIBER
    const dbRole = participant.role; // 'host', 'speaker', or 'listener'
    const agoraRole = (dbRole === 'host' || dbRole === 'speaker')
      ? RtcRole.PUBLISHER
      : RtcRole.SUBSCRIBER;

    // ── 6. Generate token ───────────────────────────────────────────
    const APP_ID          = Deno.env.get('AGORA_APP_ID')!;
    const APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE')!;

    const expireSeconds   = 3600; // 1 hour
    const currentTs       = Math.floor(Date.now() / 1000);
    const privilegeExpiry = currentTs + expireSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      agoraRole,
      privilegeExpiry,
      privilegeExpiry,
    );

    return new Response(JSON.stringify({ token, uid }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Token generation error:', err);
    return new Response(JSON.stringify({ error: 'Token generation failed' }), {
      status: 500,
      headers: CORS,
    });
  }
});
