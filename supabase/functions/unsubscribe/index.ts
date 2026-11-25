// Turns reminder emails off for the profile with this private token.
// POST from the site's /unsubscribe page ({ token }) or from a mail app's one-click unsubscribe (?t=token).
import { cors, db, fail, json } from "../_shared/http.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return fail(req, "method", 405);
  const fromQuery = new URL(req.url).searchParams.get("t");
  const body = fromQuery ? {} : await req.json().catch(() => ({}));
  const token = String(fromQuery ?? body.token ?? "");
  if (!UUID.test(token)) return fail(req, "bad_token");
  const { data, error } = await db().from("profiles").update({ email_reminders: false }).eq("unsubscribe_token", token).select("id");
  if (error) return fail(req, "server", 500);
  if (!data?.length) return fail(req, "not_found", 404);
  return json(req, { ok: true });
});
