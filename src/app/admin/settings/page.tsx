/**
 * /admin/settings — owner-editable tenant config.
 * Dangerous fields (course price, deposit %) edit-protected behind a confirm step.
 */
import { requireAdminOrRedirect } from "@/lib/auth/admin";
import { getAdminLang, ti } from "@/lib/auth/admin-lang";
import { adminClient } from "@/lib/db/clients";
import type { RestaurantSettings } from "@/lib/db/types";
import { SettingsForm } from "./settings-form";
import { mockSettings } from "../preview-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREVIEW_MODE = process.env.PREVIEW_MODE === "1";

export default async function AdminSettingsPage() {
  const lang = await getAdminLang();
  let settings: RestaurantSettings | null;
  if (PREVIEW_MODE) {
    settings = mockSettings;
  } else {
    await requireAdminOrRedirect();
    const sb = adminClient();
    const { data } = await sb
      .from("restaurant_settings")
      .select("*")
      .eq("id", 1)
      .single<RestaurantSettings>();
    settings = data;
  }

  return (
    <div className="px-6 py-6 sm:px-8">
      <h1 className="mb-6 font-[family-name:var(--font-noto-serif)] text-2xl tracking-[0.02em] text-foreground">
        {ti(lang, "設定", "Settings")}
      </h1>
      {settings ? (
        <SettingsForm settings={settings} lang={lang} />
      ) : (
        <p className="text-sm text-red-400">
          {ti(
            lang,
            "設定行が存在しません。Supabase SQL editor で 0002 migration を実行してください。",
            "Settings row missing. Run migration 0002 in Supabase SQL editor."
          )}
        </p>
      )}
    </div>
  );
}
