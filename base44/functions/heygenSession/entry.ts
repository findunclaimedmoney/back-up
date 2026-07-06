import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const HEYGEN_API = 'https://api.heygen.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('HEYGEN_API_KEY');
    if (!apiKey) return Response.json({ error: 'HeyGen API key not configured' }, { status: 500 });

    const body = await req.json();
    const { action, avatar_name, voice_id, session_id, session_token, text } = body;

    const keyHeaders = { 'Content-Type': 'application/json', 'x-api-key': apiKey };
    const bearerHeaders = (token) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

    // List public avatars and voices
    if (action === 'assets') {
      const [avRes, voRes] = await Promise.all([
        fetch(`${HEYGEN_API}/v3/avatars?ownership=public&limit=50`, { headers: keyHeaders }),
        fetch(`${HEYGEN_API}/v3/voices?type=public&limit=100`, { headers: keyHeaders }),
      ]);
      const avData = await avRes.json();
      const voData = await voRes.json();
      return Response.json({
        avatars: (avData.data || []).map(a => ({
          id: a.id,
          name: a.name,
          preview_image_url: a.preview_image_url,
          gender: a.gender,
          default_voice_id: a.default_voice_id,
        })),
        voices: (voData.data || []).map(v => ({
          voice_id: v.voice_id,
          name: v.name,
          language: v.language,
          gender: v.gender,
          preview_audio_url: v.preview_audio_url,
        })),
      });
    }

    // Create a streaming session
    if (action === 'start') {
      let aName = avatar_name || '';
      let vId = voice_id || '';

      // Fetch first public avatar/voice if not provided
      if (!aName || !vId) {
        const tasks = [];
        if (!aName) {
          tasks.push(
            fetch(`${HEYGEN_API}/v3/avatars?ownership=public&limit=1`, { headers: keyHeaders })
              .then(r => r.json())
              .then(d => { aName = d.data?.[0]?.name || ''; })
          );
        }
        if (!vId) {
          tasks.push(
            fetch(`${HEYGEN_API}/v3/voices?type=public&limit=1`, { headers: keyHeaders })
              .then(r => r.json())
              .then(d => { vId = d.data?.[0]?.voice_id || ''; })
          );
        }
        await Promise.all(tasks);
      }

      // 1. Create session token
      const tokenRes = await fetch(`${HEYGEN_API}/v1/streaming.create_token`, {
        method: 'POST',
        headers: keyHeaders,
      });
      const tokenData = await tokenRes.json();
      const sessToken = tokenData?.data?.token;
      if (!sessToken) {
        return Response.json({ error: 'Failed to create HeyGen session token', details: tokenData }, { status: 500 });
      }

      // 2. Create streaming session
      const newRes = await fetch(`${HEYGEN_API}/v1/streaming.new`, {
        method: 'POST',
        headers: bearerHeaders(sessToken),
        body: JSON.stringify({
          quality: 'high',
          avatar_name: aName,
          voice: { voice_id: vId },
          version: 'v2',
          video_encoding: 'H264',
        }),
      });
      const newData = await newRes.json();
      if (!newData?.data?.session_id) {
        return Response.json({ error: 'Failed to create streaming session', details: newData }, { status: 500 });
      }

      const sid = newData.data.session_id;

      // 3. Start session
      await fetch(`${HEYGEN_API}/v1/streaming.start`, {
        method: 'POST',
        headers: bearerHeaders(sessToken),
        body: JSON.stringify({ session_id: sid }),
      });

      return Response.json({
        session_id: sid,
        session_token: sessToken,
        url: newData.data.url,
        access_token: newData.data.access_token,
      });
    }

    // Send text to avatar (talk)
    if (action === 'talk') {
      if (!session_id || !session_token || !text) {
        return Response.json({ error: 'session_id, session_token, and text are required' }, { status: 400 });
      }
      const taskRes = await fetch(`${HEYGEN_API}/v1/streaming.task`, {
        method: 'POST',
        headers: bearerHeaders(session_token),
        body: JSON.stringify({ session_id, text, task_type: 'talk' }),
      });
      const taskData = await taskRes.json();
      return Response.json({ ok: true, data: taskData });
    }

    // Stop session
    if (action === 'stop') {
      if (!session_id || !session_token) {
        return Response.json({ error: 'session_id and session_token are required' }, { status: 400 });
      }
      await fetch(`${HEYGEN_API}/v1/streaming.stop`, {
        method: 'POST',
        headers: bearerHeaders(session_token),
        body: JSON.stringify({ session_id }),
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action. Use: assets, start, talk, stop' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});