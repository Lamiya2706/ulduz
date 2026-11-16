// Epoint posts the payment result here (configure this URL as "Result URL" in the Epoint merchant cabinet).
// Authenticated by Epoint's signature — the browser redirect alone never marks an order paid.
import { decodeData, verify } from "../_shared/epoint.ts";
import { db } from "../_shared/http.ts";
import { notifyOrderPaid } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  let data = "", signature = "";
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) { const b = await req.json(); data = b.data ?? ""; signature = b.signature ?? ""; }
  else { const f = await req.formData(); data = String(f.get("data") ?? ""); signature = String(f.get("signature") ?? ""); }
  if (!data || !signature || !(await verify(data, signature))) return new Response("bad signature", { status: 400 });

  const p = decodeData(data);
  const orderId = String(p.order_id ?? "");
  const sb = db();
  const { data: order } = await sb.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return new Response("unknown order", { status: 404 });

  const status = String(p.status ?? "");
  const patch: Record<string, unknown> = { provider_payload: p, provider_transaction: p.transaction ?? order.provider_transaction };
  if (status === "success") {
    if (p.amount != null && Math.abs(Number(p.amount) - Number(order.amount)) > 0.001) {
      console.error("amount mismatch", orderId, p.amount, order.amount);
      return new Response("amount mismatch", { status: 400 });
    }
    if (order.status !== "paid") Object.assign(patch, { status: "paid", paid_at: new Date().toISOString() });
  } else if (status === "returned" && order.status === "paid") {
    patch.status = "refunded";
  } else if ((status === "failed" || status === "error") && order.status === "pending") {
    patch.status = "failed";
  }
  await sb.from("orders").update(patch).eq("id", orderId);
  // Orders placed from the Telegram bot: send the reading link to that chat. Never fail the callback over it.
  if (patch.status === "paid" && order.tg_chat_id) {
    await notifyOrderPaid(orderId, order.lang).catch((e) => console.error("telegram notify", e));
  }
  return new Response("OK");
});
