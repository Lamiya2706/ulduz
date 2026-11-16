// Small helpers shared by all Ulduz edge functions.
import { createClient } from "npm:@supabase/supabase-js@2";

export const env = (k: string, fallback?: string) => {
  const v = Deno.env.get(k) ?? fallback;
  if (v === undefined) throw new Error(`Missing env ${k}`);
  return v;
};

export const db = () => createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

function allowedOrigin(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return allowed.length === 0 || allowed.includes(origin) ? origin || "*" : allowed[0];
}
export const cors = (req: Request) => ({
  "Access-Control-Allow-Origin": allowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});
export const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
export const fail = (req: Request, error: string, status = 400) => json(req, { error }, status);

export async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function randomToken(bytes = 32) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads an order only if the private token matches. */
export async function orderWithToken(orderId: unknown, token: unknown) {
  if (typeof orderId !== "string" || !UUID.test(orderId) || typeof token !== "string" || token.length < 20) return null;
  const { data } = await db().from("orders").select("*, charts:charts!orders_chart_id_fkey(*), partner:charts!orders_partner_chart_id_fkey(*)").eq("id", orderId).maybeSingle();
  if (!data || data.token_hash !== (await sha256(token))) return null;
  return data;
}

/** Server-Sent Events stream: send({text}) / send({error}). */
export function sseResponse(req: Request, run: (send: (o: unknown) => void) => Promise<void>) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(ctrl) {
      const send = (o: unknown) => { try { ctrl.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`)); } catch { /* client gone */ } };
      try { await run(send); } catch (e) { console.error(e); send({ error: e instanceof Error && e.message === "rate_limited" ? "rate_limited" : "generation_failed" }); }
      try { ctrl.close(); } catch { /* already closed */ }
    },
  });
  return new Response(body, { headers: { ...cors(req), "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
