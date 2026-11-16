// Answers up to 3 follow-up questions per paid reading, streaming via SSE.
import { streamClaude, type Msg } from "../_shared/anthropic.ts";
import { cors, db, fail, orderWithToken, sseResponse } from "../_shared/http.ts";
import { questionPromptSystem } from "../_shared/order-prompts.ts";

const MAX_Q = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  const body = await req.json().catch(() => ({}));
  const order = await orderWithToken(body.orderId, body.token);
  if (!order) return fail(req, "not_found", 404);
  if (order.status !== "paid") return fail(req, "not_paid", 402);
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 300) : "";
  if (!question) return fail(req, "invalid_question");

  const sb = db();
  const [{ data: reading }, { data: prev }] = await Promise.all([
    sb.from("readings").select("status, content").eq("order_id", order.id).maybeSingle(),
    sb.from("questions").select("question, answer").eq("order_id", order.id).order("created_at"),
  ]);
  if (reading?.status !== "done") return fail(req, "reading_not_ready", 409);
  if ((prev?.length ?? 0) >= MAX_Q) return fail(req, "no_questions_left", 429);

  const system = questionPromptSystem(order, reading.content);
  const messages: Msg[] = [];
  for (const q of prev ?? []) messages.push({ role: "user", content: q.question }, { role: "assistant", content: q.answer });
  messages.push({ role: "user", content: question });

  return sseResponse(req, async (send) => {
    let full = "";
    for await (const t of streamClaude(system, messages, 900)) { full += t; send({ text: t }); }
    await sb.from("questions").insert({ order_id: order.id, question, answer: full });
  });
});
