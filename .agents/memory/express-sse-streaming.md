---
name: Express 5 SSE streaming — client disconnect detection
description: Why to use res.on('close') not req.on('close') when aborting an upstream stream on client disconnect
---

For streaming (SSE) endpoints that abort an upstream call (e.g. OpenAI stream) when the
client disconnects, listen on `res.on('close')`, NOT `req.on('close')`.

**Why:** In Express 5 / Node, the request `IncomingMessage` stream emits `close` as soon
as its readable body has been fully consumed (which `express.json()` does during parsing).
So `req.on('close')` fires almost immediately — before any response is written — and an
abort wired to it silently kills the upstream stream, producing zero output. Symptom: the
endpoint hangs with no bytes until the client's own timeout, then logs "request aborted".

**How to apply:** Use `res.on('close', () => { if (!res.writableEnded) controller.abort(); })`.
`res` 'close' fires when the response/connection actually closes, i.e. a real client
disconnect, and the `writableEnded` guard avoids treating a normal completed response as a
disconnect.
