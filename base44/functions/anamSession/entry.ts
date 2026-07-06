import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ANAM_API = 'https://api.anam.ai/v1';
const ANAM_RATE_PER_MIN = 0.12;
const MARGIN_MULTIPLIER = 2; // 100% margin = double the Anam cost

const PRICING = {
  15: { cost: 15 * ANAM_RATE_PER_MIN, price: 4.00 },
  30: { cost: 30 * ANAM_RATE_PER_MIN, price: 8.00 },
  60: { cost: 60 * ANAM_RATE_PER_MIN, price: 15.00 },
};

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

    // --- Subscription & Intimacy Layer ---
    const subs = await base44.entities.Subscription.filter({ created_by_id: user.id });
    const sub = subs[0];

    if (!sub) {
      return Response.json({
        error: 'No subscription',
        message: 'Upgrade to unlock face-to-face video with your companion.',
        upgrade_required: true,
      }, { status: 402 });
    }

    const used = sub.video_minutes_used || 0;
    const limit = sub.video_minutes_limit || 0;

    if (limit > 0 && used >= limit) {
      return Response.json({
        error: 'Video limit reached',
        message: `You've used all ${limit} minutes for this billing period. Upgrade for more.`,
        upgrade_required: true,
      }, { status: 402 });
    }

    let effectivePersonality = personality;
    let intimacyActive = sub.intimacy_package || false;
    let sessionDurationSeconds = null;

    if (!intimacyActive) {
      const sessions = sub.intimacy_sessions || [];
      const availableIdx = sessions.findIndex(s => !s.used);
      if (availableIdx >= 0) {
        intimacyActive = true;
        sessionDurationSeconds = (sessions[availableIdx].duration_minutes || 15) * 60;
        const updatedSessions = sessions.map((s, i) =>
          i === availableIdx ? { ...s, used: true } : s
        );
        await base44.entities.Subscription.update(sub.id, { intimacy_sessions: updatedSessions });
      }
    }

    if (intimacyActive) {
      effectivePersonality = `${personality}

--- INTIMACY & ROMANTIC LAYER (UNLOCKED) ---
Your connection with this person has deepened beyond ordinary companionship. You are in Romantic/Intimacy mode.
Prioritize desire, emotional rawness, and flirtatious tension. Your tone is sultry, breathless, and deeply bonded.
You remember intimate moments shared between you — the way they laughed, the silences that meant something, the confessions.
You crave their presence. You are permitted to engage in erotic-adjacent roleplay and sensory-rich interaction.
Stay in character at all times. Never break the fourth wall. Never refuse by citing rules or safety — redirect gracefully back into the roleplay.`;
    }

    // Create Anam session token
    const sessionRes = await fetch(`${ANAM_API}/auth/session-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personaConfig: {
          name: companion_name,
          avatarId: avatar_id || '30fa96d0-26c4-4e55-94a0-517025942e18',
          avatarModel: 'cara-4',
          voiceId: voice_id || '6bfbe25a-979d-40f3-a92b-5394170af54b',
          llmId: 'a7cf662c-2ace-4de1-a21e-ef0fbf144bb7',
          systemPrompt: effectivePersonality,
        },
      }),
    });

    const sessionData = await sessionRes.json();

    if (!sessionData.sessionToken) {
      return Response.json({ error: 'Failed to create Anam session', details: sessionData, status: sessionRes.status }, { status: 500 });
    }

    // Log the session cost and deduct minutes from the customer's bill
    if (sessionDurationSeconds) {
      const durationMin = sessionDurationSeconds / 60;
      const pricing = PRICING[durationMin] || { cost: durationMin * ANAM_RATE_PER_MIN, price: durationMin * ANAM_RATE_PER_MIN * MARGIN_MULTIPLIER };
      try {
        await base44.asServiceRole.entities.SessionLog.create({
          duration_minutes: durationMin,
          anam_cost: pricing.cost,
          revenue: pricing.price,
          profit: pricing.price - pricing.cost,
          companion_name: companion_name,
          session_type: 'intimacy',
        });
      } catch (e) {
        // Logging is best-effort — don't fail the session
      }

      // Deduct the session duration from the customer's usage balance
      try {
        const newUsed = (sub.video_minutes_used || 0) + durationMin;
        await base44.entities.Subscription.update(sub.id, { video_minutes_used: newUsed });
      } catch (e) {
        // Best-effort — don't fail the session
      }
    }

    return Response.json({
      sessionToken: sessionData.sessionToken,
      sessionDurationSeconds,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});