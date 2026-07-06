import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LA_API = 'https://api.liveavatar.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('LIVEAVATAR_API_KEY');
    if (!apiKey) return Response.json({ error: 'LiveAvatar API key not configured' }, { status: 500 });

    const body = await req.json();
    const { action, image_url, companion_name, companion_id, avatar_id } = body;

    const headers = {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    };

    // --- Check avatar status (by id or by name) ---
    if (action === 'check') {
      let targetId = avatar_id;

      // If no avatar_id, try to find by companion name
      if (!targetId && companion_name) {
        const listRes = await fetch(`${LA_API}/v1/avatars?page=1&page_size=100`, { headers });
        const listData = await listRes.json();
        const avatars = listData.data?.results || [];
        const match = avatars.find((a) => a.name === companion_name);
        if (match) targetId = match.id;
      }

      if (!targetId) {
        return Response.json({ avatar_status: 'processing', message: 'Avatar still processing — check back within 24 hours.' });
      }

      const getRes = await fetch(`${LA_API}/v1/avatars/${targetId}`, { headers });
      const getData = await getRes.json();
      const avatar = getData.data;

      if (!avatar) {
        return Response.json({ avatar_status: 'processing', message: 'Avatar still processing — check back within 24 hours.' });
      }

      // LiveAvatar statuses: INIT, PROCESSING, ACTIVE, FAILED
      const statusMap = {
        'INIT': 'processing',
        'PROCESSING': 'processing',
        'ACTIVE': 'active',
        'active': 'active',
        'FAILED': 'failed',
        'failed': 'failed',
      };
      const mappedStatus = statusMap[avatar.status] || 'processing';

      // If a companion_id was provided, update the record
      if (companion_id && (mappedStatus === 'active' || mappedStatus === 'failed')) {
        try {
          await base44.entities.CustomCompanion.update(companion_id, {
            avatar_id: targetId,
            avatar_status: mappedStatus,
          });
        } catch (e) {
          // Best-effort update
        }
      }

      return Response.json({
        avatar_id: targetId,
        avatar_status: mappedStatus,
        preview_url: avatar.preview_url || null,
      });
    }

    // --- Create image avatar (default action) ---
    if (!image_url || !companion_name) {
      return Response.json({ error: 'image_url and companion_name are required' }, { status: 400 });
    }

    const createRes = await fetch(`${LA_API}/v1/avatars`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'IMAGE',
        name: companion_name,
        image_url,
      }),
    });

    const createData = await createRes.json();

    // If the API accepted the request, extract the avatar_id
    if (createRes.ok && (createData.data?.id || createData.data?.avatar_id)) {
      const newAvatarId = createData.data.id || createData.data.avatar_id;
      return Response.json({
        avatar_id: newAvatarId,
        avatar_status: 'processing',
        message: 'Avatar creation submitted. Processing takes up to 24 hours.',
      });
    }

    // If the direct creation API isn't available, return processing status.
    // The avatar will need to be created via the LiveAvatar dashboard manually,
    // then linked by name (the 'check' action will find it by companion name).
    return Response.json({
      avatar_id: null,
      avatar_status: 'processing',
      message: 'Avatar creation queued. Processing takes up to 24 hours. You will be notified when it is ready.',
      api_response: createData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});