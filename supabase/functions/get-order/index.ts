import { cors, db, fail, json, orderWithToken } from "../_shared/http.ts";
import { firstName } from "../_shared/prompt.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  const body = await req.json().catch(() => ({}));
  const order = await orderWithToken(body.orderId, body.token);
  if (!order) return fail(req, "not_found", 404);
  const sb = db();
  const [{ data: reading }, { data: questions }] = await Promise.all([
    sb.from("readings").select("status, content").eq("order_id", order.id).maybeSingle(),
    sb.from("questions").select("question, answer").eq("order_id", order.id).order("created_at"),
  ]);
  return json(req, {
    status: order.status, kind: order.kind, lang: order.lang, name: firstName(order.charts.full_name), chartCode: order.charts.code,
    partnerName: order.partner ? firstName(order.partner.full_name) : null, partnerCode: order.partner?.code ?? null,
    reading: reading ?? null, questions: questions ?? [],
  });
});
