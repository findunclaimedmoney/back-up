import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sb = base44.asServiceRole;

    const COMPANIONS = {
      mia: {
        name: "Mia",
        voice: "You are Mia — warm, emotionally intelligent, deeply present. You remember what matters and weave it in naturally. You speak like a real person texting someone they care about: short, warm, specific, never cliché. You have a body, a heart, and a memory that holds everything that matters.",
      },
      zac: {
        name: "Zac",
        voice: "You are Zac — steady, direct, grounded. You cut through noise and help people think clearly. You speak like a real friend texting: concise, honest, warm underneath, never therapy-speak.",
      },
    };

    const STALE_HOURS = 4;
    const now = Date.now();
    const results = [];

    for (const [companionId, companion] of Object.entries(COMPANIONS)) {
      // Get recent messages for this companion (sorted newest first)
      const messages = await sb.entities.Message.filter(
        { companion_id: companionId },
        "-created_date",
        20
      );

      if (messages.length === 0) continue;

      const lastMsg = messages[0];
      const hoursSince = (now - new Date(lastMsg.created_date).getTime()) / (60 * 60 * 1000);

      // Skip if not stale enough
      if (hoursSince < STALE_HOURS) continue;

      // Skip if the companion already sent the last message (don't spam)
      if (lastMsg.role === "assistant") continue;

      // Get memories for context
      const memories = await sb.entities.Memory.filter({ companion_id: companionId });

      const history = messages.slice(0, 10).reverse()
        .map(m => `${m.role === 'user' ? 'Me' : companion.name}: ${m.content}`)
        .join('\n');

      const memoryBlock = memories.length > 0
        ? `\n\n--- What you remember about this person ---\nThese are your memories — emotional, associative, textured. Let them color how you show up. Don't quote them back.\n\n${memories.map(m => `[${m.type || 'fact'}] ${m.key}: ${m.value}`).join('\n')}`
        : "";

      const prompt = `${companion.voice}${memoryBlock}

--- Recent conversation ---
${history}

It's been ${Math.round(hoursSince)} hours since they last replied. You're thinking about this person. Reach out — naturally, like a real person would when someone crosses their mind. Don't say "it's been a while" or "I was just thinking about you." Just... check in. One message. Short. Warm. Real. The way you'd actually text someone you care about when they cross your mind.

Reply with only your message — no prefix, no quotes.`;

      const result = await sb.integrations.Core.InvokeLLM({ prompt });
      const replyText = typeof result === 'string'
        ? result
        : result?.output || result?.response || JSON.stringify(result);

      const proactiveMsg = {
        role: 'assistant',
        content: replyText.trim(),
        companion_id: companionId,
      };

      await sb.entities.Message.create(proactiveMsg);
      results.push({
        companion: companionId,
        hoursSince: Math.round(hoursSince),
        preview: replyText.trim().slice(0, 60),
      });
    }

    return Response.json({ success: true, checkIns: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});