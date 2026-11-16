import type { Lang } from "@/i18n";
import type { BirthParams } from "./birth";

const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const backendReady = !!(URL_BASE && ANON);

export class ApiError extends Error {
  code: string;
  constructor(code: string, message?: string) { super(message ?? code); this.code = code; }
}

async function call<T>(fn: string, body: unknown): Promise<T> {
  if (!backendReady) throw new ApiError("not_configured");
  const res = await fetch(`${URL_BASE}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON!, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.error ?? `http_${res.status}`, json.message);
  return json as T;
}

/** Streams plain-text chunks from an edge function (text/event-stream with `data:` JSON lines). */
async function stream(fn: string, body: unknown, onText: (full: string) => void): Promise<string> {
  if (!backendReady) throw new ApiError("not_configured");
  const res = await fetch(`${URL_BASE}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON!, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify(body),
  });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.includes("text/event-stream")) {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(json.error ?? `http_${res.status}`);
    if (typeof json.content === "string") { onText(json.content); return json.content; }
    throw new ApiError("bad_response");
  }
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "", full = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const evt = buf.slice(0, i); buf = buf.slice(i + 2);
      for (const line of evt.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const msg = JSON.parse(line.slice(5));
        if (msg.error) throw new ApiError(msg.error);
        if (msg.text) { full += msg.text; onText(full); }
      }
    }
  }
  return full;
}

export interface OrderView {
  status: "pending" | "paid" | "failed" | "refunded";
  lang: Lang;
  kind: "natal" | "couple";
  name: string;
  chartCode: string;
  partnerName: string | null;
  partnerCode: string | null;
  reading: { status: "generating" | "done" | "error"; content: string } | null;
  questions: { question: string; answer: string }[];
}

export const api = {
  createPayment: (input: BirthParams, lang: Lang, email: string | null, partner?: BirthParams) =>
    call<{ redirectUrl: string; orderId: string; token: string }>("create-payment", { input, partner: partner ?? null, lang, email }),
  order: (orderId: string, token: string) => call<OrderView>("get-order", { orderId, token }),
  checkStatus: (orderId: string, token: string) => call<{ status: OrderView["status"] }>("check-status", { orderId, token }),
  generate: (orderId: string, token: string, onText: (t: string) => void) => stream("generate-reading", { orderId, token }, onText),
  ask: (orderId: string, token: string, question: string, onText: (t: string) => void) => stream("ask-question", { orderId, token, question }, onText),
};
