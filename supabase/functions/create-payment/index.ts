// Creates a chart + pending order and starts an Epoint hosted checkout (or, in PAYMENT_MODE=test, marks it paid).
import { validateBirth } from "../_shared/birthcode.ts";
import { clientIp, cors, db, fail, json } from "../_shared/http.ts";
import { createOrder } from "../_shared/orders.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  try {
    const body = await req.json().catch(() => null);
    const input = validateBirth(body?.input);
    const lang = body?.lang;
    if (!input || !["az", "en", "ru"].includes(lang)) return fail(req, "invalid_input");
    const partner = body?.partner == null ? null : validateBirth(body.partner);
    if (body?.partner != null && !partner) return fail(req, "invalid_input");
    const email = typeof body?.email === "string" && /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(body.email.trim()) ? body.email.trim() : null;

    const ip = clientIp(req);
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await db().from("orders").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since);
    if ((count ?? 0) >= Number(Deno.env.get("MAX_ORDERS_PER_IP_HOUR") ?? 10)) return fail(req, "rate_limited", 429);

    const o = await createOrder({ input, partner, lang, email, ip });
    return json(req, { redirectUrl: o.redirectUrl, orderId: o.orderId, token: o.token });
  } catch (e) {
    console.error("create-payment", e);
    return fail(req, "server_error", 500);
  }
});
