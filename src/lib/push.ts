// Daily horoscope push notifications: browser permission, the push subscription, and saving it to Supabase.
// The service worker (public/sw.js) shows the messages; the daily-push edge function sends them.
import { isIOS, isStandalone } from "./install";

// Public by design (it identifies the sender, the private half stays in Supabase secrets).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BHTrmnHyRGLgtP9Z11sD7YPwrFKeqqwc3_J8R5bQ3oLWMNXnTMFEZayoGcWnhb5dkmwXYiV6wzolyNvazYNj0Oc";

export type PushState = "unsupported" | "needs-install" | "denied" | "on" | "off";

const supported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** The service worker registration, or null (dev mode, or the browser blocks it). */
async function registration() {
  if (!supported()) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

function keyBytes(b64url: string) {
  const s = atob(b64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (b64url.length % 4)) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

export async function pushState(): Promise<PushState> {
  // iPhone and iPad only allow web push for an app added to the home screen.
  if (isIOS() && !isStandalone()) return "needs-install";
  const reg = await registration();
  if (!reg || !("pushManager" in reg)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const sub = await reg.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

async function save(sub: PushSubscription, lang: string) {
  const json = sub.toJSON();
  const { supabase } = await import("./supabase");
  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: sub.endpoint, p_p256dh: json.keys?.p256dh, p_auth: json.keys?.auth, p_lang: lang,
    p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  });
  if (error) throw error;
}

/** Asks for permission, subscribes this device and saves it. Resolves to the new state. */
export async function enablePush(lang: string): Promise<PushState> {
  const reg = await registration();
  if (!reg) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
  await save(sub, lang);
  return "on";
}

export async function disablePush(): Promise<PushState> {
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const { supabase } = await import("./supabase");
    await supabase.rpc("delete_push_subscription", { p_endpoint: sub.endpoint });
    await sub.unsubscribe();
  }
  return "off";
}

/** Re-saves an existing subscription (a new language or time zone, or a browser that renewed it). Never asks for permission. */
export async function syncPush(lang: string) {
  try {
    const reg = await registration();
    const sub = Notification.permission === "granted" ? await reg?.pushManager.getSubscription() : null;
    if (sub) await save(sub, lang);
  } catch { /* best effort */ }
}
