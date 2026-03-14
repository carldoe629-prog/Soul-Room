import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @deno-types="npm:agora-token@2"
import { RtcTokenBuilder, RtcRole } from 'npm:agora-token@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // Authenticate the caller — must be a logged-in Soul Room user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
    }

    const { channelName, uid, role } = await req.json();
    if (!channelName || uid === undefined || !role) {
      return new Response(JSON.stringify({ error: 'Missing channelName, uid, or role' }), { status: 400, headers: CORS });
    }

    const APP_ID          = Deno.env.get('AGORA_APP_ID')!;
    const APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE')!;

    const expireSeconds   = 3600; // 1 hour
    const currentTs       = Math.floor(Date.now() / 1000);
    const privilegeExpiry = currentTs + expireSeconds;

    const agoraRole = role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      agoraRole,
      privilegeExpiry,
      privilegeExpiry,
    );

    return new Response(JSON.stringify({ token }), {
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
