// Minimal Epoint (epoint.az) client. Signature: base64(sha1_raw(private_key + data + private_key)).
import { env } from "./http.ts";

const BASE = () => Deno.env.get("EPOINT_BASE_URL") ?? "https://epoint.az";
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

export async function sign(data: string, privateKey = env("EPOINT_PRIVATE_KEY")) {
  const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(privateKey + data + privateKey));
  return b64(new Uint8Array(d));
}
export function encodeData(payload: Record<string, unknown>) {
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== null));
  return b64(new TextEncoder().encode(JSON.stringify(clean)));
}
export function decodeData(data: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data), (c) => c.charCodeAt(0))));
}
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let m = 0; for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}
export async function verify(data: string, signature: string) {
  return timingSafeEqual(await sign(data), signature);
}

async function post(path: string, payload: Record<string, unknown>) {
  const data = encodeData({ public_key: env("EPOINT_PUBLIC_KEY"), ...payload });
  const res = await fetch(`${BASE()}${path}`, { method: "POST", body: new URLSearchParams({ data, signature: await sign(data) }) });
  const text = await res.text();
  try { return JSON.parse(text) as Record<string, unknown>; } catch { throw new Error(`epoint ${path}: ${res.status} ${text.slice(0, 200)}`); }
}

export async function createPayment(o: { orderId: string; amount: string; language: string; description: string; successUrl: string; errorUrl: string }) {
  const r = await post("/api/1/request", {
    amount: o.amount, currency: "AZN", language: o.language, order_id: o.orderId, description: o.description,
    success_redirect_url: o.successUrl, error_redirect_url: o.errorUrl,
  });
  if (r.status !== "success" || typeof r.redirect_url !== "string") throw new Error(`epoint request failed: ${JSON.stringify(r).slice(0, 300)}`);
  return { redirectUrl: r.redirect_url as string, transaction: (r.transaction as string) ?? null };
}

export async function getStatus(transaction: string) {
  return await post("/api/1/get-status", { transaction });
}
