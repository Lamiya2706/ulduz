// Asks Epoint directly for the payment status (fallback when the callback is late).
import { getStatus } from "../_shared/epoint.ts";
import { cors, db, fail, json, orderWithToken } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  const body = await req.json().catch(() => ({}));
  const order = await orderWithToken(body.orderId, body.token);
  if (!order) return fail(req, "not_found", 404);
  if (order.status !== "pending" || !order.provider_transaction || order.provider !== "epoint") return json(req, { status: order.status });
  try {
    const r = await getStatus(order.provider_transaction);
    let status = order.status;
    if (r.status === "success") status = "paid";
    else if (r.status === "failed") status = "failed";
    if (status !== order.status) await db().from("orders").update({ status, ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}), provider_payload: r }).eq("id", order.id);
    return json(req, { status });
  } catch (e) {
    console.error("check-status", e);
    return json(req, { status: order.status });
  }
});
