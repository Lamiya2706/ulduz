import { describe, expect, it } from "vitest";
import { bytesToB64url, b64urlToBytes, encryptPayload, vapidAuthorization } from "@shared/webpush";
import { dailyMessage, isDue, localNow } from "@shared/dailyPush";
import { PUSH_TEXT } from "@shared/pushText";
import az from "@/content/daily/az";
import en from "@/content/daily/en";
import ru from "@/content/daily/ru";

const webcrypto = globalThis.crypto;
const subtle = webcrypto.subtle;
type Bytes = Uint8Array<ArrayBuffer>;
const hkdf = async (salt: Bytes, ikm: Bytes, info: Bytes, n: number) =>
  new Uint8Array(await subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, await subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]), n * 8));
const te = new TextEncoder();

/** The browser's side of RFC 8291: decrypts what encryptPayload produced. */
async function decrypt(body: Bytes, ua: CryptoKeyPair, auth: Bytes) {
  const salt = body.slice(0, 16);
  const idlen = body[20];
  const asPublic = body.slice(21, 21 + idlen);
  const record = body.slice(21 + idlen);
  const uaPublic = new Uint8Array(await subtle.exportKey("raw", ua.publicKey));
  const asKey = await subtle.importKey("raw", asPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await subtle.deriveBits({ name: "ECDH", public: asKey }, ua.privateKey, 256));
  const info = new Uint8Array([...te.encode("WebPush: info\0"), ...uaPublic, ...asPublic]);
  const ikm = await hkdf(auth, ecdh, info, 32);
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const plain = new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: nonce }, await subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]), record));
  expect(plain[plain.length - 1]).toBe(2); // last-record delimiter
  return new TextDecoder().decode(plain.slice(0, -1));
}

describe("web push", () => {
  it("encrypts a payload the browser can decrypt (RFC 8291)", async () => {
    const ua = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair;
    const auth = webcrypto.getRandomValues(new Uint8Array(16));
    const sub = { p256dh: bytesToB64url(await subtle.exportKey("raw", ua.publicKey)), auth: bytesToB64url(auth) };
    const body = await encryptPayload(te.encode(JSON.stringify({ title: "Ulduz ✦", body: "Günün xeyirli olsun" })), sub);
    expect([...body.slice(16, 20)]).toEqual([0, 0, 0x10, 0]);
    expect(JSON.parse(await decrypt(body, ua, auth))).toEqual({ title: "Ulduz ✦", body: "Günün xeyirli olsun" });
  });

  it("signs a VAPID token that verifies with the public key", async () => {
    const kp = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
    const jwk = await subtle.exportKey("jwk", kp.privateKey);
    const publicKey = bytesToB64url(await subtle.exportKey("raw", kp.publicKey));
    const header = await vapidAuthorization("https://fcm.googleapis.com/fcm/send/abc", { publicKey, privateKey: jwk.d!, subject: "mailto:no-reply@ulduz.space" }, Date.UTC(2026, 10, 25));
    const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(header)!;
    expect(m[4]).toBe(publicKey);
    const claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(m[2])));
    expect(claims).toEqual({ aud: "https://fcm.googleapis.com", exp: Date.UTC(2026, 10, 25) / 1000 + 43200, sub: "mailto:no-reply@ulduz.space" });
    const ok = await subtle.verify({ name: "ECDSA", hash: "SHA-256" }, kp.publicKey, b64urlToBytes(m[3]), te.encode(`${m[1]}.${m[2]}`));
    expect(ok).toBe(true);
  });
});

describe("daily push", () => {
  const now = new Date("2026-11-25T04:10:00Z"); // 08:10 in Baku (UTC+4)
  it("reads the local date and hour", () => {
    expect(localNow("Asia/Baku", now)).toEqual({ date: "2026-11-25", hour: 8 });
    expect(localNow("America/New_York", now)).toEqual({ date: "2026-11-24", hour: 23 });
    expect(localNow("Not/AZone", now)).toEqual({ date: "2026-11-25", hour: 4 });
  });
  it("is due once a day from the chosen hour", () => {
    expect(isDue({ lang: "az", tz: "Asia/Baku", hour: 8, last_sent_on: null }, now)).toEqual({ due: true, date: "2026-11-25" });
    expect(isDue({ lang: "az", tz: "Asia/Baku", hour: 8, last_sent_on: "2026-11-25" }, now).due).toBe(false);
    expect(isDue({ lang: "az", tz: "Asia/Baku", hour: 9, last_sent_on: null }, now).due).toBe(false);
    expect(isDue({ lang: "az", tz: "Asia/Baku", hour: 4, last_sent_on: null }, now).due).toBe(false); // too late, wait for tomorrow
  });
  it("writes a personal message in the person's language", () => {
    const p = { full_name: "Ləmiyə Əsgərova", birth_date: "1995-06-27", birth_time: "14:30", lat: 40.41, lon: 49.87, tz: "Asia/Baku" };
    const m = dailyMessage(p, "az", "2026-11-25")!;
    expect(m.title).toBe("Ləmiyə, ulduzlarda sənin günün");
    expect(m.body).toMatch(/^[★☆]{5} /);
    expect(m.url).toBe("/az/today");
    expect(m.tag).toBe("daily-2026-11-25");
    expect(dailyMessage({ ...p, full_name: null }, "ru", "2026-11-25")!.title).toBe(PUSH_TEXT.ru.titleNoName);
    expect(dailyMessage({ ...p, birth_date: null }, "en", "2026-11-25")).toBeNull();
  });
  it("uses the same texts as the daily horoscope page", () => {
    for (const [lang, c] of Object.entries({ az, en, ru }) as [keyof typeof PUSH_TEXT, typeof az][]) {
      expect(PUSH_TEXT[lang].overall).toEqual(c.ui.overall);
      expect(PUSH_TEXT[lang].focus).toEqual(c.houses.map((h) => h.focus));
      expect(PUSH_TEXT[lang].title.replace("{name}", "X")).toBe(c.ui.titleFor("X"));
    }
  });
});
