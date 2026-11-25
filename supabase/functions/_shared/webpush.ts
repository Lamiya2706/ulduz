// Web Push with nothing but WebCrypto (works in Deno edge functions and in Node for tests).
// - VAPID (RFC 8292): an ES256 JWT that proves the message comes from the owner of the public key the browser subscribed with.
// - Message encryption (RFC 8291, "aes128gcm" content coding from RFC 8188).

export interface PushSubscriptionKeys { endpoint: string; p256dh: string; auth: string }
export interface VapidKeys { publicKey: string; privateKey: string; subject: string } // base64url; subject is a mailto: or https: URL

const enc = new TextEncoder();

export function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function bytesToB64url(b: ArrayBuffer | Uint8Array): string {
  const a = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

async function hkdf(salt: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, bytes: number) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8));
}

/** Encrypts a payload for one subscription. Returns the request body (header + one record). */
export async function encryptPayload(payload: Uint8Array<ArrayBuffer>, sub: { p256dh: string; auth: string }, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const uaPublic = b64urlToBytes(sub.p256dh);
  const authSecret = b64urlToBytes(sub.auth);
  if (uaPublic.length !== 65 || authSecret.length < 16) throw new Error("bad_subscription_keys");

  const as = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", as.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, as.privateKey, 256));

  const ikm = await hkdf(authSecret, ecdhSecret, concat(enc.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const record = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, concat(payload, new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 0x10, 0]); // record size 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, record);
}

/** The VAPID Authorization header for an endpoint. */
export async function vapidAuthorization(endpoint: string, vapid: VapidKeys, now = Date.now()) {
  const pub = b64urlToBytes(vapid.publicKey);
  if (pub.length !== 65) throw new Error("bad_vapid_public_key");
  const jwk: JsonWebKey = { kty: "EC", crv: "P-256", d: vapid.privateKey, x: bytesToB64url(pub.slice(1, 33)), y: bytesToB64url(pub.slice(33, 65)), ext: true };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const part = (o: unknown) => bytesToB64url(enc.encode(JSON.stringify(o)));
  const unsigned = `${part({ typ: "JWT", alg: "ES256" })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: vapid.subject })}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned));
  return `vapid t=${unsigned}.${bytesToB64url(sig)}, k=${vapid.publicKey}`;
}

export interface PushResult { ok: boolean; status: number; gone: boolean }

/** Sends one push message. `gone` means the subscription no longer exists and should be deleted. */
export async function sendPush(sub: PushSubscriptionKeys, payload: unknown, vapid: VapidKeys, opts: { ttl?: number; topic?: string } = {}): Promise<PushResult> {
  const body = await encryptPayload(enc.encode(JSON.stringify(payload)), sub);
  const headers: Record<string, string> = {
    Authorization: await vapidAuthorization(sub.endpoint, vapid),
    "Content-Encoding": "aes128gcm",
    "Content-Type": "application/octet-stream",
    TTL: String(opts.ttl ?? 12 * 3600),
    Urgency: "normal",
  };
  if (opts.topic) headers.Topic = opts.topic;
  const res = await fetch(sub.endpoint, { method: "POST", headers, body });
  await res.body?.cancel();
  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}
