import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ANAM_API = 'https://api.anam.ai/v1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { companion_name, personality, avatar_id, voice_id } = body;

    if (!companion_name || !personality) {
      return Response.json({ error: 'companion_name and personality are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('ANAM_API_KEY');
    if (!apiKey) return Response.json({ error: 'Anam API key not configured' }, { status: 500 });

    // Create session token — Anam handles the avatar/voice in real-time, no training step
    const sessionRes = await fetch(`${ANAM_API}/auth/session-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personaConfig: {
          name: companion_name,
          // Use provided avatar_id, else fall back to Anam's default Cara avatar
          avatarId: avatar_id || '30fa96d0-26c4-4e55-94a0-517025942e18',
          avatarModel: 'cara-4',
          // Use provided voice_id, else fall back to a default Anam voice
          voiceId: voice_id || '6bfbe25a-979d-40f3-a92b-5394170af54b',
          llmId: 'a7cf662c-2ace-4de1-a21e-ef0fbf144bb7',
          systemPrompt: personality,
        },
      }),
    });

    const sessionData = await sessionRes.json();

    if (!sessionData.sessionToken) {
      return Response.json({ error: 'Failed to create Anam session', details: sessionData, status: sessionRes.status }, { status: 500 });
    }

    return Response.json({ sessionToken: sessionData.sessionToken });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});