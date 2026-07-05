import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LA_API = 'https://api.liveavatar.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { companion_name, personality } = body;

    if (!companion_name || !personality) {
      return Response.json({ error: 'companion_name and personality are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('LIVEAVATAR_API_KEY');
    if (!apiKey) return Response.json({ error: 'LiveAvatar API key not configured' }, { status: 500 });

    const headers = {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    };

    // 1. Find or create a context for this companion
    let contextId;
    const contextsRes = await fetch(`${LA_API}/v1/contexts`, { headers });
    const contextsData = await contextsRes.json();
    const contextsList = contextsData.data?.results || contextsData.data || [];
    const existing = contextsList.find((c) => c.name === companion_name);

    if (existing) {
      contextId = existing.id;
    } else {
      const createRes = await fetch(`${LA_API}/v1/contexts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: companion_name,
          prompt: personality,
          opening_text: `Hi, I'm ${companion_name}.`,
        }),
      });
      const createData = await createRes.json();
      contextId = createData.data?.id;
      if (!contextId) {
        return Response.json({ error: 'Failed to create LiveAvatar context', details: createData, status: createRes.status }, { status: 500 });
      }
    }

    if (!contextId) return Response.json({ error: 'Failed to create LiveAvatar context' }, { status: 500 });

    // 2. Find an available avatar — check user avatars first (custom, must be active), then presets
    let avatarId;
    const userAvatarsRes = await fetch(`${LA_API}/v1/avatars`, { headers });
    const userAvatarsData = await userAvatarsRes.json();
    const userAvatarList = userAvatarsData.data?.results || userAvatarsData.data || [];
    const readyAvatar = userAvatarList.find(
      (a) => a.status === 'active' && (a.avatar_id || a.id)
    );
    if (readyAvatar) {
      avatarId = readyAvatar.avatar_id || readyAvatar.id;
    } else {
      const publicRes = await fetch(`${LA_API}/v1/avatars/public`, { headers });
      const publicData = await publicRes.json();
      const publicList = publicData.data?.results || publicData.data || [];
      const firstPreset = publicList.find((a) => a.avatar_id || a.id);
      avatarId = firstPreset?.avatar_id || firstPreset?.id;
    }

    if (!avatarId) return Response.json({ error: 'No avatars available. Create one at app.liveavatar.com' }, { status: 500 });

    // 3. Get a voice for the embed
    const voicesRes = await fetch(`${LA_API}/v1/voices`, { headers });
    const voicesData = await voicesRes.json();
    const voicesList = voicesData.data?.results || voicesData.data || [];
    const voiceId = voicesList[0]?.voice_id || voicesList[0]?.id;

    // 4. Create embed session
    const embedRes = await fetch(`${LA_API}/v2/embeddings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        avatar_id: avatarId,
        context_id: contextId,
        voice_id: voiceId,
        is_sandbox: false,
      }),
    });
    const embedData = await embedRes.json();

    if (!embedData.data?.url) {
      return Response.json({ error: 'Failed to create embed session', details: embedData }, { status: 500 });
    }

    return Response.json({ url: embedData.data.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});