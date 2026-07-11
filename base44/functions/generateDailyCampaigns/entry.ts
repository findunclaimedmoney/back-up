import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Pull real platform stats for authentic content
    let stats = null;
    try {
      const statsResp = await base44.asServiceRole.functions.invoke('getDashboardStats', {});
      stats = statsResp.data;
    } catch (e) {
      console.log('Stats fetch failed:', e.message);
    }

    const statsContext = stats
      ? `\nPlatform stats for authentic content: ${stats.total_users || 'growing'} total users, ${stats.active_subscriptions || 'active'} subscriptions, ${stats.total_sessions || 'many'} sessions completed.`
      : '';

    // Generate 3 diverse campaign topics
    const topicResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are GLIMR's marketing director. Generate 3 diverse Facebook marketing campaign ideas for today.

GLIMR is a companionship platform addressing loneliness through AI companions that remember you. Companions: Jess, Mia, Luna, Sophie, Natalie, Zac. Free tier — text chat, no card needed. Paid tiers: Plus ($59/mo), Pro ($89/mo), VIP ($349/mo). Sign up at glimr.app${statsContext}

Return 3 DIFFERENT campaign angles (e.g. emotional story about loneliness, feature highlight like voice/video chat, social proof/testimonial style, question-based engagement, seasonal). Each must feel distinct.

CRITICAL VIDEO RULES:
- The video_description MUST be written entirely in English.
- The video MUST be directly relevant to GLIMR — show human connection, companionship, someone using their phone to chat, a warm presence, or the feeling of being heard and remembered.
- Do NOT generate abstract, random, or off-brand visuals. Every video must clearly relate to companionship, loneliness, or digital connection.
- Include on-screen or scene context that evokes GLIMR's brand: warm lighting, a person feeling less alone, a phone screen with a conversation, etc.
- ALL people shown in the video MUST be Australian — Caucasian, Aboriginal, Torres Strait Islander, or mixed Australian appearance. Australian fashion, Australian settings (beaches, suburban homes, cafes, outback).
- Do NOT feature American-looking actors, American settings, or American cultural markers (no US flags, yellow school buses, American football, etc.).
- If any person speaks in the video, they MUST speak with an Australian accent.

Return JSON with: campaigns array, each having "topic" (short label, in English), "video_description" (detailed visual prompt for a 6-second vertical video — in English, GLIMR-relevant, specific about subject, setting, mood, lighting), "video_style" (visual mood descriptor, in English).`,
      response_json_schema: {
        type: 'object',
        properties: {
          campaigns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                video_description: { type: 'string' },
                video_style: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const campaigns = topicResult.campaigns || [];
    if (campaigns.length === 0) {
      return Response.json({ error: 'No campaigns generated' }, { status: 500 });
    }

    const created = [];

    for (const camp of campaigns) {
      // Generate caption
      const captionResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are GLIMR's marketing director. Create a Facebook post caption for this campaign: "${camp.topic}"

Platform: Facebook — longer-form, story-driven, community-building. 2-4 sentences. Warm, human tone. End with a question or CTA.
GLIMR: AI companionship platform fighting loneliness. Companions remember you. Free to start at glimr.app.

Return JSON: caption (the post text), hashtags (space-separated with #), cta (final call-to-action line).`,
        response_json_schema: {
          type: 'object',
          properties: {
            caption: { type: 'string' },
            hashtags: { type: 'string' },
            cta: { type: 'string' },
          },
        },
      });

      // Generate video
      let videoUrl = null;
      try {
        const video = await base44.asServiceRole.integrations.Core.GenerateVideo({
          prompt: `Create a 6-second vertical marketing video for GLIMR, an AI companionship platform that fights loneliness. English language only. ${camp.video_description}. Style: ${camp.video_style}. The video must clearly relate to human connection, companionship, or feeling less alone. Do not include any text or speech in languages other than English. ALL people in the video must be Australian (Caucasian, Aboriginal, Torres Strait Islander, or mixed Australian appearance) in Australian settings. No American actors, American settings, or American cultural markers. If anyone speaks, they must have an Australian accent.`,
          duration: 6,
          aspect_ratio: '9:16',
        });
        videoUrl = video.url;
      } catch (e) {
        console.log('Video generation failed for campaign:', camp.topic, e.message);
      }

      // Save campaign as draft
      const saved = await base44.asServiceRole.entities.MarketingCampaign.create({
        topic: camp.topic,
        caption: `${captionResult.caption}\n\n${captionResult.hashtags}\n\n${captionResult.cta}`,
        hashtags: captionResult.hashtags || '',
        cta: captionResult.cta || '',
        video_url: videoUrl,
        platform: 'facebook',
        status: 'draft',
        batch_date: today,
      });

      created.push({ id: saved.id, topic: camp.topic, video_url: videoUrl });
    }

    // Email admin for approval
    const campaignList = created
      .map((c, i) => `Campaign ${i + 1}: ${c.topic}\nVideo: ${c.video_url || 'Video generation failed — caption still available'}`)
      .join('\n\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: `🎬 3 Facebook Campaigns Ready for Approval — ${today}`,
      body: `Hi! Mia here.\n\nI've prepared 3 Facebook marketing campaigns for today. Each has a caption and a generated video for you to review.\n\n${campaignList}\n\nReview and approve them here: https://glimr.app/campaign-review\n\nWarm,\nMia`,
    });

    return Response.json({ success: true, created: created.length, campaigns: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});