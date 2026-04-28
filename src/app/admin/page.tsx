/**
 * /admin — Operator Dashboard.
 *
 * Designed for daily ops (not vanity). Focus:
 *   1. Compact KPI bar (month revenue, target %, no-show rate, covers)
 *   2. Today's seat occupancy at a glance (S1/S2 bar fills)
 *   3. Today's confirmed list with inline `settle` / `no-show` shortcut links
 *   4. Tomorrow + 2-days preview (3 mini cards)
 *   5. Action queue — past unsettled, missing reminders, system no-shows that
 *      need owner confirmation
 *   6. 7-day revenue ledger
 *   7. Recent audit-log activity (audit-trail visibility)
 *
 * JA / EN switchable via the cookie-backed `admin-lang` toggle in the sidebar.
 */
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Check,
  Target,
  Users,
  Wallet,
  Clock,
  Activity,
} from "lucide-react";
import { requireAdminOrRedirect } from "@/lib/auth/admin";
import { getAdminLang, ti, type AdminLang } from "@/lib/auth/admin-lang";
import { adminClient } from "@/lib/db/clients";
import { formatPHP } from "@/lib/domain/reservation";
import type {
  Reservation,
  RestaurantSettings,
  RevenueDaily,
  RevenueMonthly,
} from "@/lib/db/types";
import {
  mockSettings,
  mockMonthly,
  mockNoShow,
  mockDaily,
  mockReservations,
} from "./preview-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREVIEW_MODE = process.env.PREVIEW_MODE === "1";

interface NoShowRow {
  month_start: string;
  no_show_count: number;
  eligible_covers: number;
  no_show_rate_pct: number;
}

interface AuditRow {
  id: number;
  occurred_at: string;
  actor: string;
  action: string;
  reservation_id: string | null;
}

export default async function AdminDashboardPage() {
  const lang = await getAdminLang();
  // Server-component snapshot of "now"; the react-hooks/purity rule is a
  // browser-component heuristic that doesn't apply to async server components.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();

  let settings: RestaurantSettings | null = null;
  let monthly: RevenueMonthly | null = null;
  let daily7: RevenueDaily[] | null = null;
  let noShow: NoShowRow | null = null;
  let allUpcoming: Reservation[] | null = null;
  let unsettledPast: Reservation[] | null = null;
  let recentAudits: AuditRow[] | null = null;

  if (PREVIEW_MODE) {
    settings = mockSettings;
    monthly = mockMonthly;
    noShow = mockNoShow;
    daily7 = mockDaily;
    // Surface every confirmed/completed/no_show booking ±2 days for the preview.
    allUpcoming = mockReservations;
    unsettledPast = mockReservations.filter(
      (r) => r.status === "confirmed" && r.service_date < todayIsoDate()
    );
    recentAudits = [
      { id: 1, occurred_at: new Date(nowMs).toISOString(), actor: "webhook", action: "reservation.confirm", reservation_id: "11111111-1111-1111-1111-111111111111" },
      { id: 2, occurred_at: new Date(nowMs - 7200_000).toISOString(), actor: "system", action: "reservation.no_show", reservation_id: "55555555-5555-5555-5555-555555555555" },
      { id: 3, occurred_at: new Date(nowMs - 86400_000).toISOString(), actor: "guest", action: "reservation.cancel.full", reservation_id: "66666666-6666-6666-6666-666666666666" },
    ];
  } else {
    await requireAdminOrRedirect();
    const sb = adminClient();
    const monthStart = currentMonthStart();
    const monthIso = monthStart.toISOString().slice(0, 10);
    const today = todayIsoDate();
    const dayPlus2 = isoDateDaysAhead(2);

    const [settingsRes, monthlyRes, dailyRes, noShowRes, upcomingRes, unsettledRes, auditsRes] =
      await Promise.all([
        sb.from("restaurant_settings").select("*").eq("id", 1).single<RestaurantSettings>(),
        sb.from("revenue_monthly").select("*").eq("month_start", monthIso).maybeSingle<RevenueMonthly>(),
        sb
          .from("revenue_daily")
          .select("*")
          .gte("service_date", isoDateDaysAgo(7))
          .lte("service_date", isoDateDaysAgo(0))
          .order("service_date", { ascending: false })
          .returns<RevenueDaily[]>(),
        sb.from("no_show_rate").select("*").eq("month_start", monthIso).maybeSingle<NoShowRow>(),
        sb
          .from("reservations")
          .select("*")
          .gte("service_date", today)
          .lte("service_date", dayPlus2)
          .in("status", ["confirmed", "completed"])
          .order("service_starts_at", { ascending: true })
          .returns<Reservation[]>(),
        sb
          .from("reservations")
          .select("*")
          .lt("service_date", today)
          .eq("status", "confirmed")
          .order("service_starts_at", { ascending: false })
          .limit(20)
          .returns<Reservation[]>(),
        sb
          .from("audit_log")
          .select("id,occurred_at,actor,action,reservation_id")
          .order("occurred_at", { ascending: false })
          .limit(10)
          .returns<AuditRow[]>(),
      ]);
    settings = settingsRes.data;
    monthly = monthlyRes.data;
    daily7 = dailyRes.data;
    noShow = noShowRes.data;
    allUpcoming = upcomingRes.data;
    unsettledPast = unsettledRes.data;
    recentAudits = auditsRes.data;
  }

  const today = todayIsoDate();
  const tomorrow = isoDateDaysAhead(1);
  const dayPlus2 = isoDateDaysAhead(2);
  const onlineSeats = settings?.online_seats ?? 8;

  // Group upcoming by date+seating
  const todayList = (allUpcoming ?? []).filter((r) => r.service_date === today);
  const tomorrowList = (allUpcoming ?? []).filter((r) => r.service_date === tomorrow);
  const dayPlus2List = (allUpcoming ?? []).filter((r) => r.service_date === dayPlus2);

  // Action queue — items needing owner attention
  const reminderDue = (allUpcoming ?? []).filter((r) => {
    const hoursOut = (new Date(r.service_starts_at).getTime() - nowMs) / 3_600_000;
    return r.status === "confirmed" && hoursOut < 24 && hoursOut > 2 && !r.reminder_long_sent_at;
  });
  const systemNoShows: Reservation[] = []; // would query in real mode

  // KPI calcs
  const monthRevenue = monthly?.net_completed_centavos ?? 0;
  const monthBookedGross = monthly?.gross_booked_centavos ?? 0;
  const monthTarget = settings?.monthly_revenue_target_centavos ?? 0;
  const targetPct = monthTarget > 0 ? Math.round((monthRevenue / monthTarget) * 100) : 0;
  const noShowPct = noShow?.no_show_rate_pct ?? 0;
  const noShowOver = noShowPct > 5;

  return (
    <div className="px-6 py-6 sm:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-noto-serif)] text-xl tracking-[0.04em] text-foreground">
            {ti(lang, "ダッシュボード", "Dashboard")}
          </h1>
          <p className="mt-0.5 text-[11px] tracking-[0.06em] text-text-muted">
            {formatToday(lang)}
          </p>
        </div>
        <Link
          href="/admin/reservations"
          className="text-[11px] uppercase tracking-[0.18em] text-gold/70 hover:text-gold"
        >
          {ti(lang, "予約一覧へ →", "All reservations →")}
        </Link>
      </header>

      {/* ── KPI bar ──────────────────────────────────────────────────────── */}
      <section className="mb-8 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi
          icon={<Wallet size={14} />}
          label={ti(lang, "今月の売上 (純)", "Net revenue (mo)")}
          value={formatPHP(monthRevenue, lang)}
          sub={ti(lang, `予約総額 ${formatPHP(monthBookedGross, lang)}`, `Booked ${formatPHP(monthBookedGross, lang)}`)}
        />
        <Kpi
          icon={<Target size={14} />}
          label={ti(lang, "目標達成率", "Target progress")}
          value={monthTarget > 0 ? `${targetPct}%` : "—"}
          sub={
            monthTarget > 0
              ? ti(lang, `目標 ${formatPHP(monthTarget, lang)}`, `Target ${formatPHP(monthTarget, lang)}`)
              : ti(lang, "目標は設定で入力", "Set target in settings")
          }
        />
        <Kpi
          icon={<AlertTriangle size={14} />}
          label={ti(lang, "no-show率", "No-show rate")}
          value={`${noShowPct}%`}
          sub={ti(lang, `${noShow?.no_show_count ?? 0}件 / ${noShow?.eligible_covers ?? 0}カバー`, `${noShow?.no_show_count ?? 0} of ${noShow?.eligible_covers ?? 0}`)}
          warn={noShowOver}
        />
        <Kpi
          icon={<Users size={14} />}
          label={ti(lang, "今月の予約数", "Covers (mo)")}
          value={`${monthly?.covers_booked ?? 0}`}
          sub={ti(lang, `キャンセル ${monthly?.cancel_count ?? 0}件`, `Cancels ${monthly?.cancel_count ?? 0}`)}
        />
      </section>

      {/* ── Action queue ─────────────────────────────────────────────────── */}
      {(unsettledPast?.length || reminderDue.length || systemNoShows.length) ? (
        <section className="mb-8 border border-amber-500/30 bg-amber-500/[0.04] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-amber-400">
            <AlertTriangle size={13} />
            {ti(lang, "要対応", "Needs attention")}
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {unsettledPast && unsettledPast.length > 0 && (
              <ActionItem
                count={unsettledPast.length}
                label={ti(lang, "過去予約の精算が未完了", "Past reservations not yet settled")}
                href="/admin/reservations?filter=past"
              />
            )}
            {reminderDue.length > 0 && (
              <ActionItem
                count={reminderDue.length}
                label={ti(lang, "24時間前リマインダー未送信", "24h reminder not yet sent")}
                href="/admin/reservations?filter=upcoming"
                tone="info"
              />
            )}
          </ul>
        </section>
      ) : null}

      {/* ── Today: seat occupancy + table ────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gold/70">
          <Clock size={13} />
          {ti(lang, "今日", "Today")}
        </h2>
        <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-3 border border-border bg-surface/40 p-4">
            <SeatBar
              label={`17:30 ${ti(lang, "1部", "Seating 1")}`}
              taken={paxAt(todayList, "s1")}
              total={onlineSeats}
            />
            <SeatBar
              label={`19:30 ${ti(lang, "2部", "Seating 2")}`}
              taken={paxAt(todayList, "s2")}
              total={onlineSeats}
            />
            <p className="mt-1 text-[10px] tracking-[0.04em] text-text-muted">
              {ti(
                lang,
                `合計 ${todayList.length}件 / ${todayList.reduce((s, r) => s + r.party_size, 0)}名`,
                `${todayList.length} bookings · ${todayList.reduce((s, r) => s + r.party_size, 0)} guests`
              )}
            </p>
          </div>

          <ReservationsTable list={todayList} lang={lang} dense includeActions />
        </div>
      </section>

      {/* ── Tomorrow + day after ─────────────────────────────────────────── */}
      <section className="mb-8 grid gap-3 lg:grid-cols-2">
        <DayCard
          dateLabel={dateHeader(tomorrow, lang)}
          list={tomorrowList}
          onlineSeats={onlineSeats}
          lang={lang}
        />
        <DayCard
          dateLabel={dateHeader(dayPlus2, lang)}
          list={dayPlus2List}
          onlineSeats={onlineSeats}
          lang={lang}
        />
      </section>

      {/* ── Past 7 days revenue ──────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gold/70">
          <Wallet size={13} />
          {ti(lang, "直近7日間の売上", "Past 7 days")}
        </h2>
        <div className="overflow-x-auto border border-border bg-surface/40">
          <table className="w-full text-[13px]">
            <thead className="border-b border-border text-[10px] uppercase tracking-[0.16em] text-text-muted">
              <tr>
                <th className="px-3 py-2 text-left">{ti(lang, "日付", "Date")}</th>
                <th className="px-3 py-2 text-right">{ti(lang, "予約", "Cov.")}</th>
                <th className="px-3 py-2 text-right">{ti(lang, "純売上", "Net rev")}</th>
                <th className="px-3 py-2 text-right">{ti(lang, "No-show", "No-show")}</th>
                <th className="px-3 py-2 text-right">{ti(lang, "保留売上", "Kept")}</th>
                <th className="px-3 py-2 text-right">{ti(lang, "失った売上", "Lost")}</th>
              </tr>
            </thead>
            <tbody>
              {(daily7 ?? []).map((d) => (
                <tr key={d.service_date} className="border-b border-border/40 last:border-b-0">
                  <td className="px-3 py-2 font-mono text-[11px] text-text-muted">{d.service_date}</td>
                  <td className="px-3 py-2 text-right">{d.covers_booked}</td>
                  <td className="px-3 py-2 text-right">{formatPHP(d.net_completed_centavos, lang)}</td>
                  <td
                    className={
                      d.no_show_count > 0
                        ? "px-3 py-2 text-right text-red-400"
                        : "px-3 py-2 text-right text-text-muted"
                    }
                  >
                    {d.no_show_count}
                  </td>
                  <td className="px-3 py-2 text-right text-gold">
                    {formatPHP(d.no_show_deposit_kept_centavos, lang)}
                  </td>
                  <td className="px-3 py-2 text-right text-red-400/80">
                    {formatPHP(d.no_show_lost_centavos, lang)}
                  </td>
                </tr>
              ))}
              {(daily7 ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-text-muted">
                    {ti(lang, "データがありません。", "No data.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Recent activity (audit log preview) ──────────────────────────── */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gold/70">
          <Activity size={13} />
          {ti(lang, "最近のアクティビティ", "Recent activity")}
        </h2>
        <ul className="border border-border bg-surface/40 divide-y divide-border/40">
          {(recentAudits ?? []).map((a) => (
            <li
              key={a.id}
              className="grid grid-cols-[88px_88px_1fr_auto] items-center gap-3 px-3 py-2 text-[12px]"
            >
              <span className="font-mono text-[11px] text-text-muted">
                {new Date(a.occurred_at).toLocaleTimeString(lang === "ja" ? "ja-JP" : "en-PH", {
                  timeZone: "Asia/Manila",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-gold/60">
                {a.actor}
              </span>
              <span className="truncate">{actionLabel(a.action, lang)}</span>
              {a.reservation_id && (
                <Link
                  href={`/admin/reservations/${a.reservation_id}`}
                  className="text-[10px] uppercase tracking-[0.16em] text-gold/60 hover:text-gold"
                >
                  →
                </Link>
              )}
            </li>
          ))}
          {(recentAudits ?? []).length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-text-muted">
              {ti(lang, "履歴がありません。", "No activity yet.")}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function Kpi({
  icon,
  label,
  value,
  sub,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div className="border border-border bg-surface/40 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-text-muted">
        <span className={warn ? "text-red-400" : "text-gold/70"}>{icon}</span>
        {label}
      </div>
      <div className={warn ? "font-mono text-lg text-red-400" : "font-mono text-lg text-foreground"}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-text-muted">{sub}</div>}
    </div>
  );
}

function ActionItem({
  count,
  label,
  href,
  tone,
}: {
  count: number;
  label: string;
  href: string;
  tone?: "info";
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center justify-between gap-3 border border-border/30 bg-background/30 px-3 py-2 hover:border-gold/40 hover:bg-surface/50"
      >
        <span className="flex items-center gap-3">
          <span
            className={
              tone === "info"
                ? "inline-flex h-6 w-6 items-center justify-center bg-gold/15 text-[11px] font-medium text-gold"
                : "inline-flex h-6 w-6 items-center justify-center bg-amber-500/15 text-[11px] font-medium text-amber-400"
            }
          >
            {count}
          </span>
          <span className="text-foreground">{label}</span>
        </span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-gold/60 group-hover:text-gold">
          →
        </span>
      </Link>
    </li>
  );
}

function SeatBar({
  label,
  taken,
  total,
}: {
  label: string;
  taken: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, (taken / total) * 100) : 0;
  const full = pct >= 100;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.14em] text-text-secondary">{label}</span>
        <span className="font-mono text-[11px] text-foreground">
          {taken}/{total}
        </span>
      </div>
      <div className="h-1.5 w-full bg-background/60">
        <div
          className={
            full
              ? "h-full bg-red-500/70"
              : pct > 75
                ? "h-full bg-amber-500/70"
                : "h-full bg-gold/70"
          }
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function ReservationsTable({
  list,
  lang,
  dense,
  includeActions,
}: {
  list: Reservation[];
  lang: AdminLang;
  dense?: boolean;
  includeActions?: boolean;
}) {
  if (list.length === 0) {
    return (
      <div className="border border-border bg-surface/30 px-3 py-5 text-center text-sm text-text-muted">
        {ti(lang, "予約はありません。", "No bookings.")}
      </div>
    );
  }
  const cellPad = dense ? "px-3 py-2" : "px-4 py-3";
  return (
    <div className="overflow-x-auto border border-border bg-surface/40">
      <table className="w-full text-[13px]">
        <thead className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-text-muted">
          <tr>
            <th className={`${cellPad} text-left`}>{ti(lang, "時間", "Time")}</th>
            <th className={`${cellPad} text-left`}>{ti(lang, "お客様", "Guest")}</th>
            <th className={`${cellPad} text-right`}>{ti(lang, "人数", "Pax")}</th>
            <th className={`${cellPad} text-right`}>{ti(lang, "残金", "Balance")}</th>
            <th className={`${cellPad} text-left`}>{ti(lang, "リマインダー", "Reminders")}</th>
            <th className={`${cellPad} text-left`}>{ti(lang, "状態", "Status")}</th>
            {includeActions && <th className={`${cellPad} text-right`}>{ti(lang, "操作", "Action")}</th>}
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} className="border-b border-border/40 last:border-b-0 hover:bg-background/30">
              <td className={`${cellPad} font-mono text-[11px]`}>
                {new Date(r.service_starts_at).toLocaleTimeString(lang === "ja" ? "ja-JP" : "en-PH", {
                  timeZone: "Asia/Manila",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className={cellPad}>
                <div className="text-foreground">
                  {r.guest_name}
                  {r.notes && <span title={r.notes} className="ml-1.5 text-amber-400" aria-label="has notes">●</span>}
                </div>
                <div className="text-[10px] text-text-muted">{r.guest_phone}</div>
              </td>
              <td className={`${cellPad} text-right font-mono`}>{r.party_size}</td>
              <td className={`${cellPad} text-right font-mono text-gold`}>
                {formatPHP(r.balance_centavos, lang)}
              </td>
              <td className={`${cellPad} text-[11px]`}>
                <ReminderDots reservation={r} />
              </td>
              <td className={cellPad}>
                <StatusPill status={r.status} lang={lang} />
              </td>
              {includeActions && (
                <td className={`${cellPad} text-right`}>
                  <Link
                    href={`/admin/reservations/${r.id}`}
                    className="text-[10px] uppercase tracking-[0.14em] text-gold/70 hover:text-gold"
                  >
                    {ti(lang, "詳細", "Detail")}
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReminderDots({ reservation }: { reservation: Reservation }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Dot label="24h" sent={!!reservation.reminder_long_sent_at} />
      <Dot label="2h" sent={!!reservation.reminder_short_sent_at} />
    </span>
  );
}

function Dot({ label, sent }: { label: string; sent: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span
        className={
          sent
            ? "inline-block h-2 w-2 rounded-full bg-gold"
            : "inline-block h-2 w-2 rounded-full border border-text-muted/40"
        }
        aria-hidden="true"
      />
      <span className="text-[10px] text-text-muted">{label}</span>
    </span>
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
    completed: { ja: "終了", en: "Done" },
    no_show: { ja: "no-show", en: "No-show" },
    cancelled_full: { ja: "Cx (100%)", en: "Cx (100%)" },
    cancelled_partial: { ja: "Cx (50%)", en: "Cx (50%)" },
    cancelled_late: { ja: "Cx (0%)", en: "Cx (0%)" },
    expired: { ja: "期限切れ", en: "Expired" },
  };
  return (
    <span className={`inline-block border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${styles[status]}`}>
      {labels[status][lang]}
    </span>
  );
}

function DayCard({
  dateLabel,
  list,
  onlineSeats,
  lang,
}: {
  dateLabel: string;
  list: Reservation[];
  onlineSeats: number;
  lang: AdminLang;
}) {
  const s1 = paxAt(list, "s1");
  const s2 = paxAt(list, "s2");
  return (
    <div className="border border-border bg-surface/40 p-4">
      <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-gold/70">{dateLabel}</p>
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <SeatBar label="17:30" taken={s1} total={onlineSeats} />
        <SeatBar label="19:30" taken={s2} total={onlineSeats} />
      </div>
      <p className="mt-3 text-[11px] text-text-muted">
        {list.length === 0
          ? ti(lang, "予約なし", "No bookings")
          : ti(
              lang,
              `${list.length}件 / ${list.reduce((s, r) => s + r.party_size, 0)}名`,
              `${list.length} bookings · ${list.reduce((s, r) => s + r.party_size, 0)} guests`
            )}
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function paxAt(list: Reservation[], slot: "s1" | "s2"): number {
  return list.filter((r) => r.seating === slot).reduce((s, r) => s + r.party_size, 0);
}

function todayIsoDate(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return d.toISOString().slice(0, 10);
}
function isoDateDaysAgo(days: number): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function isoDateDaysAhead(days: number): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function currentMonthStart(): Date {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function formatToday(lang: AdminLang): string {
  const d = new Date();
  return d.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function dateHeader(iso: string, lang: AdminLang): string {
  const d = new Date(`${iso}T00:00:00+08:00`);
  return d.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
function actionLabel(action: string, lang: AdminLang): string {
  const map: Record<string, { ja: string; en: string }> = {
    "reservation.confirm": { ja: "予約が確定しました", en: "Reservation confirmed" },
    "reservation.no_show": { ja: "no-show としてマーク", en: "Marked as no-show" },
    "reservation.cancel.full": { ja: "100%返金でキャンセル", en: "Cancelled (100% refund)" },
    "reservation.cancel.partial": { ja: "50%返金でキャンセル", en: "Cancelled (50% refund)" },
    "reservation.cancel.late": { ja: "返金なしでキャンセル", en: "Cancelled (no refund)" },
    "reservation.settle": { ja: "精算を完了", en: "Settled" },
    "reservation.expired": { ja: "決済期限切れ", en: "Expired (no payment)" },
    "settings.update": { ja: "設定を更新", en: "Settings updated" },
  };
  return map[action]?.[lang] ?? action;
}

// (lint silence: we may use these icons in a future commit)
void Bell;
void Check;
