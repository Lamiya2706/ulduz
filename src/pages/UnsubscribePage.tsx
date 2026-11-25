import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import AuthShell from "@/components/AuthShell";
import { useLang } from "@/components/Layout";
import { track } from "@/lib/analytics";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase";

/** The "Unsubscribe" link in reminder emails: turns reminders off without signing in. */
export default function UnsubscribePage() {
  const { t } = useTranslation();
  const lang = useLang();
  const [params] = useSearchParams();
  const token = params.get("t") ?? "";
  const [state, setState] = useState<"working" | "done" | "bad">("working");

  useEffect(() => {
    let alive = true;
    fetch(`${SUPABASE_URL}/functions/v1/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
      body: JSON.stringify({ token }),
    })
      .then((r) => { if (alive) { setState(r.ok ? "done" : "bad"); if (r.ok) track("reminders_unsubscribe"); } })
      .catch(() => alive && setState("bad"));
    return () => { alive = false; };
  }, [token]);

  return (
    <AuthShell eyebrow="Ulduz" title={t("auth.unsubscribe.title")}>
      <p role="status" className={state === "bad" ? "text-rose" : "text-ivory"}>{t(`auth.unsubscribe.${state}`)}</p>
      {state === "done" && <p className="text-sm text-muted">{t("auth.unsubscribe.again")}</p>}
      {state !== "working" && <Link to={`/${lang}/account`} className="btn-ghost justify-self-start">{t("auth.unsubscribe.account")}</Link>}
    </AuthShell>
  );
}
