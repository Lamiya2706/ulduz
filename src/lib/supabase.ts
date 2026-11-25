// Browser Supabase client, used for sign-in and the user's profile.
// The URL and publishable key are public by design (row-level security protects the data), so they ship as defaults;
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY override them, e.g. for a local Supabase stack.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://sjxvmmcsrqdzuapfktnh.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_7cQFfVdHoEsPgYqe6G3RqA_Uoo-rjYW";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "ulduz.auth" },
});

/** Absolute URL of a page on this site, for the links in auth emails and the Google redirect. */
export const siteUrl = (path: string) => `${location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;

export interface Profile {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  lat: number | null;
  lon: number | null;
  tz: string | null;
  lang: string | null;
}
export type ProfilePatch = Partial<Omit<Profile, "id">>;
