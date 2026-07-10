import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'generate_post': {
        const { topic, platform = 'facebook', tone = 'warm' } = body;
        const platformGuides = {
          facebook: 'Facebook: longer-form, story-driven, community-building. 2-4 sentences. Warm, human tone. End with a question or CTA.',
          instagram: 'Instagram: visual-first, scroll-stopping hook in first line. 1-3 sentences. Trending hashtags. Use emojis tastefully.',
          tiktok: 'TikTok: POV-style, short punchy hook. Casual, trendy language. Maximum 2 sentences + hashtags.',
        };
        const prompt = `You are GLIMR's marketing director. Create a social media post about: "${topic}"\n\nPlatform: ${platform}\nTone: ${tone}\n${platformGuides[platform] || platformGuides.facebook}\n\nGLIMR is a companionship platform addressing loneliness through AI companions that remember you. Free tier available — text chat, no card needed.\n\nReturn JSON with: caption (string), hashtags (string, space-separated with #), cta (string, the call-to-action line).\nDo NOT include quotes around the values.`;
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              caption: { type: 'string' },
              hashtags: { type: 'string' },
              cta: { type: 'string' },
            },
          },
        });
        return Response.json(result);
      }

      case 'create_video': {
        const { description } = body;
        const video = await base44.asServiceRole.integrations.Core.GenerateVideo({
          prompt: description,
          duration: 6,
          aspect_ratio: '9:16',
        });
        return Response.json({ video_url: video.url, message: 'Video created successfully' });
      }

      case 'list_pages': {
        const conn = await base44.asServiceRole.connectors.getConnection('facebook_pages');
        const resp = await fetch('https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token', {
          headers: { Authorization: `Bearer ${conn.accessToken}` },
        });
        const data = await resp.json();
        return Response.json({ pages: data.data || [] });
      }

      case 'publish_facebook': {
        const { message, page_id, image_url, video_url } = body;
        const conn = await base44.asServiceRole.connectors.getConnection('facebook_pages');

        let targetPageId = page_id;
        let pageToken = null;

        if (!targetPageId) {
          const pagesResp = await fetch('https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token', {
            headers: { Authorization: `Bearer ${conn.accessToken}` },
          });
          const pagesData = await pagesResp.json();
          if (!pagesData.data || pagesData.data.length === 0) {
            return Response.json({ error: 'No Facebook Pages found. Make sure your account manages a Page.' }, { status: 400 });
          }
          const firstPage = pagesData.data[0];
          targetPageId = firstPage.id;
          pageToken = firstPage.access_token;
        } else {
          const pagesResp = await fetch('https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token', {
            headers: { Authorization: `Bearer ${conn.accessToken}` },
          });
          const pagesData = await pagesResp.json();
          const page = (pagesData.data || []).find(p => p.id === targetPageId);
          pageToken = page?.access_token;
        }

        if (!pageToken) {
          return Response.json({ error: 'Could not get Page access token' }, { status: 400 });
        }

        let postResp;
        if (video_url) {
          postResp = await fetch(`https://graph.facebook.com/v25.0/${targetPageId}/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_url: video_url, description: message, access_token: pageToken }),
          });
        } else if (image_url) {
          postResp = await fetch(`https://graph.facebook.com/v25.0/${targetPageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: image_url, message, access_token: pageToken }),
          });
        } else {
          postResp = await fetch(`https://graph.facebook.com/v25.0/${targetPageId}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, access_token: pageToken }),
          });
        }

        const result = await postResp.json();
        if (result.error) return Response.json({ error: result.error.message }, { status: 400 });
        return Response.json({ success: true, post_id: result.id || result.post_id, message: 'Posted to Facebook successfully' });
      }

      case 'publish_instagram': {
        const { caption, image_url } = body;
        if (!image_url) return Response.json({ error: 'Instagram requires an image_url' }, { status: 400 });

        const conn = await base44.asServiceRole.connectors.getConnection('instagram');
        const userResp = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${conn.accessToken}`);
        const userData = await userResp.json();

        if (userData.error) return Response.json({ error: userData.error.message }, { status: 400 });

        const igUserId = userData.id;

        // Step 1: Create media container
        const createResp = await fetch(`https://graph.instagram.com/v25.0/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url, caption, access_token: conn.accessToken }),
        });
        const createData = await createResp.json();
        if (createData.error) return Response.json({ error: createData.error.message }, { status: 400 });

        // Step 2: Publish
        const publishResp = await fetch(`https://graph.instagram.com/v25.0/${igUserId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: createData.id, access_token: conn.accessToken }),
        });
        const publishData = await publishResp.json();
        if (publishData.error) return Response.json({ error: publishData.error.message }, { status: 400 });

        return Response.json({ success: true, media_id: publishData.id, message: 'Posted to Instagram successfully' });
      }

      case 'get_ads': {
        const { account_id } = body;
        const conn = await base44.asServiceRole.connectors.getConnection('meta_ads');

        let actId = account_id;
        if (!actId) {
          const accountsResp = await fetch('https://graph.facebook.com/v25.0/me/adaccounts?fields=account_id,name', {
            headers: { Authorization: `Bearer ${conn.accessToken}` },
          });
          const accountsData = await accountsResp.json();
          if (!accountsData.data || accountsData.data.length === 0) {
            return Response.json({ error: 'No ad accounts found' }, { status: 400 });
          }
          actId = accountsData.data[0].account_id;
        }

        const insightsResp = await fetch(`https://graph.facebook.com/v25.0/act_${actId}/insights?fields=campaign_name,spend,clicks,impressions,reach,actions&level=campaign&date_preset=last_30d`, {
          headers: { Authorization: `Bearer ${conn.accessToken}` },
        });
        const insightsData = await insightsResp.json();
        if (insightsData.error) return Response.json({ error: insightsData.error.message }, { status: 400 });

        return Response.json({
          account_id: actId,
          campaigns: insightsData.data || [],
          message: `Found ${(insightsData.data || []).length} campaigns in the last 30 days`,
        });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});