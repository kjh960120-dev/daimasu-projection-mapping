/**
 * /admin/settings — owner-editable tenant config.
 * Dangerous fields (course price, deposit %) edit-protected behind a confirm step.
 */
import { requireAdminOrRedirect } from "@/lib/auth/admin";
import { adminClient } from "@/lib/db/clients";
import type { RestaurantSettings } from "@/lib/db/types";
import { SettingsForm } from "./settings-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminOrRedirect();
  const sb = adminClient();
  const { data: settings } = await sb
    .from("restaurant_settings")
    .select("*")
    .eq("id", 1)
    .single<RestaurantSettings>();

  return (
    <div className="px-8 py-8 sm:px-12 sm:py-12">
      <h1 className="mb-8 font-[family-name:var(--font-noto-serif)] text-2xl tracking-[0.04em] text-foreground">
        Settings
      </h1>
      {settings ? (
        <SettingsForm settings={settings} />
      ) : (
        <p className="text-sm text-red-400">
          Settings row missing. Run migration 0002 in Supabase SQL editor.
        </p>
      )}
    </div>
  );
}
