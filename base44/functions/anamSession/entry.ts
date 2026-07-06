import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ANAM_API = 'https://api.anam.ai/v1';
const ANAM_RATE_PER_MIN = 0.12;
const MARGIN_MULTIPLIER = 2; // 100% margin = double the Anam cost
const LOW_BALANCE_THRESHOLD = 4.00; // Cheapest session price — alert below this

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
      const duration = body.duration;
      const pricing = PRICING[duration];

      if (!duration || !pricing) {
        return Response.json({
          error: 'Duration required',
          message: 'Select a session duration to begin.',
          duration_required: true,
          credit_balance: sub.credit_balance || 0,
        }, { status: 400 });
      }

      const balance = sub.credit_balance || 0;
      if (balance < pricing.price) {
        return Response.json({
          error: 'Insufficient credit',
          message: `You need $${pricing.price.toFixed(2)} for a ${duration}-minute session. You have $${balance.toFixed(2)} in credit.`,
          upgrade_required: true,
          credit_balance: balance,
          session_price: pricing.price,
        }, { status: 402 });
      }

      intimacyActive = true;
      sessionDurationSeconds = duration * 60;

      // Deduct from credit balance + track minutes used
      const newBalance = balance - pricing.price;
      await base44.entities.Subscription.update(sub.id, {
        credit_balance: newBalance,
        video_minutes_used: (sub.video_minutes_used || 0) + duration,
      });

      // Low balance notification — send email if below threshold
      if (newBalance < LOW_BALANCE_THRESHOLD) {
        try {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: 'Your GLIMR credit is running low',
            body: `Hi ${user.full_name || 'there'},\n\nYour intimate session with ${companion_name} just started, and your remaining credit balance is $${newBalance.toFixed(2)}.\n\nThat's not enough for another session. Top up anytime to keep the connection going:\nhttps://glimr.app/pricing\n\nWith warmth,\nThe GLIMR Team`,
          });
        } catch (e) {
          // Notification is best-effort
        }
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

    // Log the session cost for admin tracking
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
    }

    // Determine remaining balance for the response
    const updatedSubs = await base44.entities.Subscription.filter({ created_by_id: user.id });
    const remainingBalance = updatedSubs[0]?.credit_balance ?? 0;

    return Response.json({
      sessionToken: sessionData.sessionToken,
      sessionDurationSeconds,
      credit_balance: remainingBalance,
      low_balance_warning: remainingBalance < LOW_BALANCE_THRESHOLD,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});