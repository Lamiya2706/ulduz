// Writes the personal reading with Claude and streams it to the browser (SSE). One paid order = one reading.
import { streamClaude } from "../_shared/anthropic.ts";
import { cors, db, fail, json, orderWithToken, sseResponse } from "../_shared/http.ts";
import { readingPrompt } from "../_shared/order-prompts.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  const body = await req.json().catch(() => ({}));
  const order = await orderWithToken(body.orderId, body.token);
  if (!order) return fail(req, "not_found", 404);
  if (order.status !== "paid") return fail(req, "not_paid", 402);

  const sb = db();
  const { data: existing } = await sb.from("readings").select("*").eq("order_id", order.id).maybeSingle();
  if (existing?.status === "done") return json(req, { content: existing.content });
  if (existing?.status === "generating" && Date.now() - new Date(existing.updated_at).getTime() < 180_000) return fail(req, "in_progress", 409);
  if ((existing?.attempts ?? 0) >= 4) return fail(req, "too_many_attempts", 429);

  const now = new Date().toISOString();
  await sb.from("readings").upsert({ order_id: order.id, lang: order.lang, status: "generating", content: "", attempts: (existing?.attempts ?? 0) + 1, updated_at: now });

  const { system, user } = readingPrompt(order);
  const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5-5";

  return sseResponse(req, async (send) => {
    let full = "", lastSave = Date.now();
    try {
      for await (const t of streamClaude(system, [{ role: "user", content: user }], 4500)) {
        full += t; send({ text: t });
        if (Date.now() - lastSave > 5000) { lastSave = Date.now(); await sb.from("readings").update({ content: full, updated_at: new Date().toISOString() }).eq("order_id", order.id); }
      }
      await sb.from("readings").update({ content: full, status: "done", model, updated_at: new Date().toISOString() }).eq("order_id", order.id);
    } catch (e) {
      await sb.from("readings").update({ status: "error", content: full, updated_at: new Date().toISOString() }).eq("order_id", order.id);
      throw e;
    }
  });
});
