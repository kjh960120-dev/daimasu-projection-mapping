/**
 * /admin/reservations/new — owner-side manual booking.
 *
 * Use cases: phone reservation, walk-in, regular guest the owner is logging in
 * after the fact. Bypasses Stripe deposit; status starts at `confirmed`.
 *
 * The form pre-loads:
 *  - 14-day capacity grid (which slots are full / closed) so the owner sees
 *    options at a glance
 *  - settings (course price + deposit %) for display
 *
 * Capacity is re-checked atomically on submit via assert_capacity_or_throw.
 */
import { requireAdminOrRedirect } from "@/lib/auth/admin";
import { getAdminLang, ti } from "@/lib/auth/admin-lang";
import { adminClient } from "@/lib/db/clients";
import type { Reservation, RestaurantSettings } from "@/lib/db/types";
import { mockSettings, mockReservations } from "../../preview-mode";
import { ManualBookingForm } from "./booking-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREVIEW_MODE = process.env.PREVIEW_MODE === "1";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; seating?: string }>;
}) {
  const lang = await getAdminLang();
  const sp = await searchParams;

  let settings: RestaurantSettings | null;
  const occupancy: Map<string, { s1: number; s2: number }> = new Map();
  let closedDates: Set<string> = new Set();

  const today = todayIsoDate();
  const horizon = isoDateDaysAhead(30);

  if (PREVIEW_MODE) {
    settings = mockSettings;
    for (const r of mockReservations) {
      if (
        (r.status === "confirmed" || r.status === "pending_payment") &&
        r.service_date >= today &&
        r.service_date <= horizon
      ) {
        const cur = occupancy.get(r.service_date) ?? { s1: 0, s2: 0 };
        cur[r.seating] += r.party_size;
        occupancy.set(r.service_date, cur);
      }
    }
  } else {
    await requireAdminOrRedirect();
    const sb = adminClient();
    const [{ data: settingsRow }, { data: rows }, { data: closed }] =
      await Promise.all([
        sb
          .from("restaurant_settings")
          .select("*")
          .eq("id", 1)
          .single<RestaurantSettings>(),
        sb
          .from("reservations")
          .select("service_date,seating,party_size,status")
          .gte("service_date", today)
          .lte("service_date", horizon)
          .in("status", ["confirmed", "pending_payment"])
          .returns<
            Pick<Reservation, "service_date" | "seating" | "party_size" | "status">[]
          >(),
        sb
          .from("closed_dates")
          .select("closed_date")
          .gte("closed_date", today)
          .lte("closed_date", horizon)
          .returns<{ closed_date: string }[]>(),
      ]);
    settings = settingsRow;
    for (const r of rows ?? []) {
      const cur = occupancy.get(r.service_date) ?? { s1: 0, s2: 0 };
      cur[r.seating] += r.party_size;
      occupancy.set(r.service_date, cur);
    }
    closedDates = new Set((closed ?? []).map((c) => c.closed_date));
  }

  if (!settings) {
    return (
      <div className="px-6 py-6">
        <p className="text-sm text-red-400">
          {ti(
            lang,
            "設定行が見つかりません。",
            "Settings row missing. Run migration 0002."
          )}
        </p>
      </div>
    );
  }

  // Build 14-day grid for the form
  const grid = [];
  for (let i = 0; i < 14; i++) {
    const date = isoDateDaysAhead(i);
    const occ = occupancy.get(date) ?? { s1: 0, s2: 0 };
    grid.push({
      date,
      s1_taken: occ.s1,
      s2_taken: occ.s2,
      closed: closedDates.has(date),
    });
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-3 font-[family-name:var(--font-noto-serif)] text-2xl tracking-[0.02em] text-foreground">
        {ti(lang, "新規予約 (店舗側)", "New booking (owner-side)")}
      </h1>
      <p className="mb-6 max-w-2xl admin-body text-text-secondary">
        {ti(
          lang,
          "電話・来店・スタッフ手動入力用。Stripe決済は不要で、保存と同時に確定状態になります。返金規約は通常通り適用されます。",
          "For phone, walk-in, or staff entries. No Stripe deposit; created in confirmed state. Refund policy applies normally."
        )}
      </p>

      <ManualBookingForm
        lang={lang}
        settings={settings}
        grid={grid}
        defaultDate={sp.date}
        defaultSeating={sp.seating === "s2" ? "s2" : sp.seating === "s1" ? "s1" : undefined}
      />
    </div>
  );
}

function todayIsoDate(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return d.toISOString().slice(0, 10);
}
function isoDateDaysAhead(days: number): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
