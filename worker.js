export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Content-Type": "application/json; charset=utf-8"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (url.pathname === "/api/health") return json({ ok: true, service: "KTY-01 API" }, 200, cors);
    if (!url.pathname.startsWith("/api/")) {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return json({ error: "Static assets binding is not configured" }, 500, cors);
    }
    if (url.pathname !== "/api/chat" && url.pathname !== "/api/image") return json({ error: "Not found" }, 404, cors);
    if (request.method !== "POST") return json({ error: "Use POST" }, 405, cors);
    if (!env.OPENAI_API_KEY) return json({ error: "Server is missing OPENAI_API_KEY. Add it as a secret before using AI features." }, 503, cors);

    try {
      const body = await request.json();
      if (url.pathname === "/api/chat") {
        if (!Array.isArray(body.messages) || body.messages.length === 0) return json({ error: "messages must be a non-empty array" }, 400, cors);
        const messages = body.messages.slice(-24).map(m => {
          if (!["user", "assistant"].includes(m.role) || typeof m.content !== "string") throw new Error("Invalid message format");
          return { role: m.role, content: m.content.slice(0, 16000) };
        });
        const upstream = await fetch(env.OPENAI_CHAT_URL || "https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: env.OPENAI_CHAT_MODEL || "gpt-4.1-mini",
            messages: [{ role: "system", content: String(body.system || "You are KTY-01, a helpful AI companion.").slice(0, 12000) }, ...messages],
            temperature: 0.8
          })
        });
        const data = await upstream.json();
        if (!upstream.ok) return json({ error: data.error?.message || `AI provider returned ${upstream.status}` }, 502, cors);
        return json({ reply: data.choices?.[0]?.message?.content || "" }, 200, cors);
      }
      const prompt = String(body.prompt || "").trim().slice(0, 4000);
      if (!prompt) return json({ error: "prompt is required" }, 400, cors);
      const upstream = await fetch(env.OPENAI_IMAGE_URL || "https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: env.OPENAI_IMAGE_MODEL || "gpt-image-1", prompt, size: "1024x1024" })
      });
      const data = await upstream.json();
      if (!upstream.ok) return json({ error: data.error?.message || `Image provider returned ${upstream.status}` }, 502, cors);
      const item = data.data?.[0];
      if (item?.url) return json({ url: item.url, revisedPrompt: item.revised_prompt || "" }, 200, cors);
      if (item?.b64_json) return json({ error: "Image was generated as base64. Configure an image delivery/storage step before enabling this response mode." }, 502, cors);
      return json({ error: "The image provider returned no usable image URL." }, 502, cors);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Unexpected server error" }, 400, cors);
    }
  }
};
function json(data, status, headers) { return new Response(JSON.stringify(data), { status, headers }); }
