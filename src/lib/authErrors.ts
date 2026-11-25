// Maps a Supabase auth error (or an error code from an email link) to a key under auth.err in src/i18n/auth.ts.
export type AuthErrKey =
  | "invalid_credentials" | "email_not_confirmed" | "user_exists" | "weak_password" | "rate_limit"
  | "email_invalid" | "same_password" | "link_expired" | "network" | "generic";

export function authErrorKey(e: unknown): AuthErrKey {
  const err = (e ?? {}) as { code?: string; status?: number; message?: string; name?: string };
  const code = err.code ?? "";
  const msg = err.message ?? "";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(msg)) return "invalid_credentials";
  if (code === "email_not_confirmed" || /email not confirmed/i.test(msg)) return "email_not_confirmed";
  if (code === "user_already_exists" || code === "email_exists" || /already registered/i.test(msg)) return "user_exists";
  if (code === "weak_password" || /password should/i.test(msg)) return "weak_password";
  if (code.startsWith("over_") || err.status === 429) return "rate_limit";
  if (code === "email_address_invalid" || code === "email_address_not_authorized" || /invalid.*email|email.*invalid/i.test(msg)) return "email_invalid";
  if (code === "same_password") return "same_password";
  if (["otp_expired", "flow_state_expired", "flow_state_not_found", "bad_code_verifier", "access_denied"].includes(code)) return "link_expired";
  if (err.name === "AuthRetryableFetchError" || /failed to fetch|network/i.test(msg)) return "network";
  return "generic";
}

/** Error code that Supabase puts in the URL when an email link or Google sign-in fails (?error_code=… or #error_code=…). */
export function urlAuthError(search: string, hash: string): AuthErrKey | null {
  for (const s of [search, hash.replace(/^#/, "?")]) {
    const p = new URLSearchParams(s);
    const code = p.get("error_code") ?? p.get("error");
    if (code) return authErrorKey({ code, message: p.get("error_description") ?? "" });
  }
  return null;
}
