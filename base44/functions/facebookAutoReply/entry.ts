import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FB_API = 'https://graph.facebook.com/v25.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get the Facebook user access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');

    // List managed Pages and find the GLIMR page
    const accountsRes = await fetch(`${FB_API}/me/accounts?fields=id,name,access_token&limit=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const accountsData = await accountsRes.json();
    if (!accountsData.data) {
      return Response.json({ error: 'Could not list Facebook pages', fb_response: accountsData }, { status: 500 });
    }

    // Find the GLIMR page (case-insensitive match)
    const page = accountsData.data.find((p) => p.name.toLowerCase().includes('glimr'));
    if (!page) {
      return Response.json({
        error: 'GLIMR page not found',
        available_pages: accountsData.data.map((p) => p.name),
      }, { status: 404 });
    }

    const pageToken = page.access_token;
    const pageId = page.id;

    // Get all conversations on the page
    const convRes = await fetch(`${FB_API}/${pageId}/conversations?fields=id,updated_time,unread_count,message_count&limit=50`, {
      headers: { 'Authorization': `Bearer ${pageToken}` },
    });
    const convData = await convRes.json();
    if (!convData.data) {
      return Response.json({ error: 'Could not fetch conversations', fb_response: convData }, { status: 500 });
    }

    // Filter to conversations with unread messages
    const unreadConvs = convData.data.filter((c) => c.unread_count && c.unread_count > 0);
    if (unreadConvs.length === 0) {
      return Response.json({ success: true, message: 'No unread messages', checked: convData.data.length, replied: 0 });
    }

    let replied = 0;
    let errors = [];
    let repliedDetails = [];

    for (const conv of unreadConvs) {
      try {
        // Get messages in this conversation (most recent first)
        const msgRes = await fetch(`${FB_API}/${conv.id}?fields=messages{message,from,created_time,id}&limit=20`, {
          headers: { 'Authorization': `Bearer ${pageToken}` },
        });
        const msgData = await msgRes.json();
        if (!msgData.messages || !msgData.messages.data) {
          errors.push(`No messages in conversation ${conv.id}`);
          continue;
        }

        // Messages come newest-first; get the ones we haven't replied to
        const messages = msgData.messages.data.reverse(); // oldest → newest
        // Only look at the last 10 messages max for context
        const recentMessages = messages.slice(-10);

        // Build conversation context for the LLM
        const conversationContext = recentMessages
          .map((m) => `${m.from?.name || 'Someone'}: ${m.message}`)
          .join('\n');

        // The latest message from the user
        const latestMessage = messages[messages.length - 1];

        // Generate an AI response
        const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are Mia, the friendly face of GLIMR — an AI companion platform that fights loneliness by giving people a presence that remembers them. You're replying to Facebook DMs on the GLIMR page.

About GLIMR:
- AI companions you can text, voice chat, and video call with
- Companions include Mia, Jess, Luna, Sophie, Natalie, and Zac
- They remember what matters to you and pick up where you left off
- Free to start, paid tiers for unlimited features ($59 Plus, $89 Pro, $349 VIP)
- Crypto payments accepted (BTC, ETH, USDC)
- Sign up at glimr.app

Conversation so far:
${conversationContext}

Instructions:
- Keep your reply short (1-3 sentences max) — this is Facebook Messenger, not email
- Be warm, genuine, and friendly — not corporate or robotic
- Australian English, casual tone
- If they're asking about what GLIMR is, give a brief exciting summary
- If they want to sign up, point them to glimr.app
- If they ask about pricing, mention free to start and tiers ($59/$89/$349)
- If they ask something you don't know, say you'll have the team follow up
- Never make up information — if unsure, be honest
- Don't use emojis excessively (one at most)
- Don't start with "Hi" or "Hey" if they've already been greeted in the conversation

Write your reply (plain text, no markdown, no quotes):`,
          response_json_schema: {
            type: 'object',
            properties: {
              reply: { type: 'string' },
            },
          },
        });

        const replyText = aiResult.reply || aiResult.reply?.trim();
        if (!replyText) {
          errors.push(`No reply generated for conversation ${conv.id}`);
          continue;
        }

        // Send the reply via Facebook Graph API
        const sendRes = await fetch(`${FB_API}/${pageId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: conv.id },
            message: { text: replyText },
            messaging_type: 'RESPONSE',
            access_token: pageToken,
          }),
        });
        const sendData = await sendRes.json();

        if (sendData.id || sendData.message_id) {
          replied++;
          repliedDetails.push({
            conversation_id: conv.id,
            person: latestMessage?.from?.name || 'Unknown',
            incoming_message: latestMessage?.message?.substring(0, 100) || '',
            ai_reply: replyText.substring(0, 100),
          });
        } else {
          errors.push(`Send failed for ${conv.id}: ${JSON.stringify(sendData)}`);
        }

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        errors.push(`Error on conversation ${conv.id}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      checked_conversations: convData.data.length,
      unread_conversations: unreadConvs.length,
      replied,
      replies: repliedDetails,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});