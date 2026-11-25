// Shares the signed-in user and their profile across the site.
// The Supabase client is loaded lazily so it stays out of the first page bundle.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile, ProfilePatch } from "./supabase";

export const BIRTH_KEY = "ulduz.birthdate";
const client = () => import("./supabase").then((m) => m.supabase);

interface AuthState {
  /** False until the stored session (and any ?code= from an email link) has been read. */
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  /** An email or Google link came back with a code that could not be used (expired, or opened in another browser). */
  linkFailed: boolean;
  saveProfile: (patch: ProfilePatch) => Promise<Profile>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  ready: false, user: null, profile: null, linkFailed: false,
  saveProfile: () => Promise.reject(new Error("no auth provider")), signOut: async () => {},
});

/** Lets the Personal Day widget (Sky.tsx) use the birth date from the profile. */
function syncBirthDate(p: Profile | null) {
  if (!p?.birth_date) return;
  try { localStorage.setItem(BIRTH_KEY, p.birth_date); } catch { /* storage unavailable */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [linkFailed, setLinkFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let unsubscribe = () => {};
    const hadCode = new URLSearchParams(location.search).has("code");
    client().then(async (sb) => {
      const { data: sub } = sb.auth.onAuthStateChange((_event, session) => { if (alive) setUser(session?.user ?? null); });
      unsubscribe = () => sub.subscription.unsubscribe();
      const { error } = await sb.auth.initialize();
      const { data } = await sb.auth.getSession();
      if (!alive) return;
      setUser(data.session?.user ?? null);
      if (hadCode && error && !data.session) setLinkFailed(true);
      if (hadCode) {
        // Drop the one-time ?code= from the address bar.
        const url = new URL(location.href);
        url.searchParams.delete("code");
        history.replaceState(history.state, "", url.pathname + url.search + url.hash);
      }
      setReady(true);
    }).catch(() => { if (alive) setReady(true); });
    return () => { alive = false; unsubscribe(); };
  }, []);

  const uid = user?.id;
  useEffect(() => {
    if (!uid) { setProfile(null); return; }
    let alive = true;
    client().then(async (sb) => {
      let { data } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle<Profile>();
      // The sign-up trigger normally creates the row; this covers accounts made before it existed.
      if (!data) ({ data } = await sb.from("profiles").upsert({ id: uid }).select().single<Profile>());
      if (!alive) return;
      setProfile(data ?? null);
      syncBirthDate(data ?? null);
    }).catch(() => { /* the account page shows the empty form */ });
    return () => { alive = false; };
  }, [uid]);

  const saveProfile = useCallback(async (patch: ProfilePatch) => {
    if (!uid) throw new Error("not signed in");
    const sb = await client();
    const { data, error } = await sb.from("profiles").upsert({ id: uid, ...patch }).select().single<Profile>();
    if (error) throw error;
    setProfile(data);
    syncBirthDate(data);
    return data;
  }, [uid]);

  const signOut = useCallback(async () => {
    const sb = await client();
    await sb.auth.signOut();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ ready, user, profile, linkFailed, saveProfile, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
