/**
 * /admin/reservations — paginated list with filters.
 * Default view: upcoming (today + future), confirmed/pending only.
 * Filters: ?status=all|confirmed|pending|cancelled|past
 */
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/auth/admin";
import { getAdminLang, ti, type AdminLang } from "@/lib/auth/admin-lang";
import { adminClient } from "@/lib/db/clients";
import { formatPHP } from "@/lib/domain/reservation";
import type { Reservation } from "@/lib/db/types";
import { mockReservations } from "../preview-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREVIEW_MODE = process.env.PREVIEW_MODE === "1";

const FILTERS = [
  { key: "upcoming", labelJa: "今後の予約", labelEn: "Upcoming" },
  { key: "today", labelJa: "本日", labelEn: "Today" },
  { key: "past", labelJa: "過去", labelEn: "Past" },
  { key: "all", labelJa: "すべて", labelEn: "All" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const lang = await getAdminLang();
  const sp = await searchParams;
  const filter = (FILTERS.find((f) => f.key === sp.filter)?.key ??
    "upcoming") as FilterKey;
  const today = todayIsoDate();

  let rows: Reservation[] | null;
  if (PREVIEW_MODE) {
    rows = mockReservations.filter((r) => {
      switch (filter) {
        case "upcoming":
          return r.service_date >= today && (r.status === "pending_payment" || r.status === "confirmed");
        case "today":
          return r.service_date === today;
        case "past":
          return r.service_date < today;
        case "all":
          return true;
      }
    });
  } else {
    await requireAdminOrRedirect();
    const sb = adminClient();
    let q = sb.from("reservations").select("*").limit(200);
    switch (filter) {
      case "upcoming":
        q = q
          .gte("service_date", today)
          .in("status", ["pending_payment", "confirmed"])
          .order("service_starts_at", { ascending: true });
        break;
      case "today":
        q = q
          .eq("service_date", today)
          .order("service_starts_at", { ascending: true });
        break;
      case "past":
        q = q.lt("service_date", today).order("service_date", { ascending: false });
        break;
      case "all":
        q = q.order("created_at", { ascending: false });
        break;
    }
    const { data } = await q.returns<Reservation[]>();
    rows = data;
  }

  return (
    <div className="px-6 py-6 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-noto-serif)] text-xl tracking-[0.04em] text-foreground">
          {ti(lang, "予約一覧", "Reservations")}
        </h1>
        <nav className="flex gap-1 text-[11px] uppercase tracking-[0.16em]">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/reservations?filter=${f.key}`}
              className={
                f.key === filter
                  ? "border border-gold/60 bg-gold/10 px-3 py-1.5 text-gold"
                  : "border border-transparent px-3 py-1.5 text-text-muted hover:text-foreground"
              }
            >
              {ti(lang, f.labelJa, f.labelEn)}
            </Link>
          ))}
        </nav>
      </div>

      {rows && rows.length > 0 ? (
        <div className="overflow-x-auto border border-border bg-surface/40">
          <table className="w-full text-[13px]">
            <thead className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-text-muted">
              <tr>
                <th className="px-3 py-2 text-left">{ti(lang, "日時", "When")}</th>
                <th className="px-3 py-2 text-left">{ti(lang, "お客様", "Guest")}</th>
                <th className="px-3 py-2 text-right">{ti(lang, "人数", "Pax")}</th>
                <th className="px-3 py-2 text-right">{ti(lang, "合計", "Total")}</th>
                <th className="px-3 py-2 text-left">{ti(lang, "状態", "Status")}</th>
                <th className="px-3 py-2 text-right">{ti(lang, "操作", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/40 last:border-b-0 hover:bg-background/30">
                  <td className="px-3 py-2 font-mono text-[11px]">
                    <div>
                      {new Date(r.service_starts_at).toLocaleString(lang === "ja" ? "ja-JP" : "en-PH", {
                        timeZone: "Asia/Manila",
                        month: "short",
                        day: "2-digit",
                        weekday: "short",
                      })}
                    </div>
                    <div className="text-text-muted">
                      {new Date(r.service_starts_at).toLocaleTimeString(lang === "ja" ? "ja-JP" : "en-PH", {
                        timeZone: "Asia/Manila",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-foreground">{r.guest_name}</div>
                    <div className="text-[10px] text-text-muted">
                      {r.guest_phone} · {r.guest_email}
                    </div>
                    {r.notes && (
                      <div className="mt-0.5 max-w-md text-[10px] text-gold/70 line-clamp-2">
                        {ti(lang, "備考: ", "Note: ")}
                        {r.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{r.party_size}</td>
                  <td className="px-3 py-2 text-right text-foreground">
                    {formatPHP(r.total_centavos, lang)}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={r.status} lang={lang} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/reservations/${r.id}`}
                      className="text-[10px] uppercase tracking-[0.16em] text-gold/70 hover:text-gold"
                    >
                      {ti(lang, "詳細", "View")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="border border-border bg-surface/30 px-3 py-5 text-sm text-text-muted">
          {ti(lang, "予約はありません。", "No reservations.")}
        </p>
      )}
    </div>
  );
}

function StatusPill({
  status,
  lang,
}: {
  status: Reservation["status"];
  lang: AdminLang;
}) {
  const styles: Record<Reservation["status"], string> = {
    pending_payment: "border-yellow-500/40 text-yellow-400",
    confirmed: "border-gold/60 text-gold",
    completed: "border-green-500/40 text-green-400",
    no_show: "border-red-500/60 text-red-400",
    cancelled_full: "border-text-muted/40 text-text-muted",
    cancelled_partial: "border-text-muted/40 text-text-muted",
    cancelled_late: "border-text-muted/40 text-text-muted",
    expired: "border-text-muted/30 text-text-muted/70",
  };
  const labels: Record<Reservation["status"], { ja: string; en: string }> = {
    pending_payment: { ja: "決済待ち", en: "Pending" },
    confirmed: { ja: "確定", en: "Confirmed" },
    completed: { ja: "終了", en: "Completed" },
    no_show: { ja: "no-show", en: "No-show" },
    cancelled_full: { ja: "Cx (100%)", en: "Cancelled (100%)" },
    cancelled_partial: { ja: "Cx (50%)", en: "Cancelled (50%)" },
    cancelled_late: { ja: "Cx (0%)", en: "Cancelled (0%)" },
    expired: { ja: "期限切れ", en: "Expired" },
  };
  return (
    <span
      className={`inline-block border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${styles[status]}`}
    >
      {labels[status][lang]}
    </span>
  );
}

function todayIsoDate(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return d.toISOString().slice(0, 10);
}
