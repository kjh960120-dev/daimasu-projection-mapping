/**
 * /admin — owner dashboard.
 *
 * Shows:
 *   - This month: revenue vs target, no-show rate, covers booked
 *   - Today's confirmed list with arrival times + balance owed
 *   - Past 7 days revenue trend (mini-table)
 */
import { CalendarDays, Wallet, AlertTriangle, Target, Users } from "lucide-react";
import { requireAdminOrRedirect } from "@/lib/auth/admin";
import { adminClient } from "@/lib/db/clients";
import { formatPHP } from "@/lib/domain/reservation";
import type {
  Reservation,
  RestaurantSettings,
  RevenueDaily,
  RevenueMonthly,
} from "@/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface NoShowRow {
  month_start: string;
  no_show_count: number;
  eligible_covers: number;
  no_show_rate_pct: number;
}

export default async function AdminDashboardPage() {
  await requireAdminOrRedirect();
  const sb = adminClient();

  const { data: settings } = await sb
    .from("restaurant_settings")
    .select("*")
    .eq("id", 1)
    .single<RestaurantSettings>();

  // Month boundary (Manila local — server runs UTC, so adjust)
  const monthStart = currentMonthStart();
  const monthIso = monthStart.toISOString().slice(0, 10);

  const [{ data: monthly }, { data: daily7 }, { data: noShow }, { data: today }] =
    await Promise.all([
      sb
        .from("revenue_monthly")
        .select("*")
        .eq("month_start", monthIso)
        .maybeSingle<RevenueMonthly>(),
      sb
        .from("revenue_daily")
        .select("*")
        .gte("service_date", isoDateDaysAgo(7))
        .lte("service_date", isoDateDaysAgo(0))
        .order("service_date", { ascending: false })
        .returns<RevenueDaily[]>(),
      sb
        .from("no_show_rate")
        .select("*")
        .eq("month_start", monthIso)
        .maybeSingle<NoShowRow>(),
      sb
        .from("reservations")
        .select("*")
        .eq("service_date", todayIsoDate())
        .in("status", ["confirmed", "completed"])
        .order("service_starts_at", { ascending: true })
        .returns<Reservation[]>(),
    ]);

  const monthRevenue = monthly?.net_completed_centavos ?? 0;
  const monthBookedGross = monthly?.gross_booked_centavos ?? 0;
  const monthTarget = settings?.monthly_revenue_target_centavos ?? 0;
  const targetPct =
    monthTarget > 0 ? Math.round((monthRevenue / monthTarget) * 100) : 0;
  const noShowPct = noShow?.no_show_rate_pct ?? 0;

  return (
    <div className="px-8 py-8 sm:px-12 sm:py-12">
      <h1 className="mb-8 font-[family-name:var(--font-noto-serif)] text-2xl tracking-[0.04em] text-foreground">
        Dashboard
      </h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Wallet size={18} />}
          label="Net revenue (this month)"
          value={formatPHP(monthRevenue)}
          sub={`Booked gross ${formatPHP(monthBookedGross)}`}
        />
        <Stat
          icon={<Target size={18} />}
          label="Target progress"
          value={monthTarget > 0 ? `${targetPct}%` : "—"}
          sub={
            monthTarget > 0
              ? `Target ${formatPHP(monthTarget)}`
              : "Set monthly target in Settings"
          }
        />
        <Stat
          icon={<AlertTriangle size={18} />}
          label="No-show rate"
          value={`${noShowPct}%`}
          sub={`${noShow?.no_show_count ?? 0} of ${noShow?.eligible_covers ?? 0} covers`}
          warn={noShowPct > 5}
        />
        <Stat
          icon={<Users size={18} />}
          label="Covers booked (this month)"
          value={`${monthly?.covers_booked ?? 0}`}
          sub={`Cancels ${monthly?.cancel_count ?? 0}`}
        />
      </section>

      {/* Today's lineup */}
      <section className="mt-12">
        <h2 className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-gold/70">
          <CalendarDays size={14} />
          Today
        </h2>
        {today && today.length > 0 ? (
          <div className="border border-border bg-surface/40">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-[0.16em] text-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Guest</th>
                  <th className="px-4 py-3 text-right">Pax</th>
                  <th className="px-4 py-3 text-right">Deposit</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {today.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 last:border-b-0">
                    <td className="px-4 py-3 font-mono text-xs">
                      {new Date(r.service_starts_at).toLocaleTimeString("en-PH", {
                        timeZone: "Asia/Manila",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{r.guest_name}</div>
                      <div className="text-[11px] text-text-muted">
                        {r.guest_phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{r.party_size}</td>
                    <td className="px-4 py-3 text-right text-text-muted">
                      {formatPHP(r.deposit_centavos)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gold">
                      {formatPHP(r.balance_centavos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="border border-border bg-surface/30 px-4 py-6 text-sm text-text-muted">
            No confirmed reservations for today.
          </p>
        )}
      </section>

      {/* Past 7 days */}
      <section className="mt-12">
        <h2 className="mb-4 text-sm uppercase tracking-[0.2em] text-gold/70">
          Past 7 days
        </h2>
        <div className="border border-border bg-surface/40">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.16em] text-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Covers</th>
                <th className="px-4 py-3 text-right">Net rev</th>
                <th className="px-4 py-3 text-right">No-shows</th>
                <th className="px-4 py-3 text-right">No-show $ kept</th>
                <th className="px-4 py-3 text-right">No-show $ lost</th>
              </tr>
            </thead>
            <tbody>
              {(daily7 ?? []).map((d) => (
                <tr key={d.service_date} className="border-b border-border/40 last:border-b-0">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">
                    {d.service_date}
                  </td>
                  <td className="px-4 py-3 text-right">{d.covers_booked}</td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {formatPHP(d.net_completed_centavos)}
                  </td>
                  <td
                    className={
                      d.no_show_count > 0
                        ? "px-4 py-3 text-right text-red-400"
                        : "px-4 py-3 text-right text-text-muted"
                    }
                  >
                    {d.no_show_count}
                  </td>
                  <td className="px-4 py-3 text-right text-gold">
                    {formatPHP(d.no_show_deposit_kept_centavos)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400">
                    {formatPHP(d.no_show_lost_centavos)}
                  </td>
                </tr>
              ))}
              {(daily7 ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-text-muted">
                    No data in the past 7 days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
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
    <div className="border border-border bg-surface/40 p-5">
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-muted">
        <span className={warn ? "text-red-400" : "text-gold/70"}>{icon}</span>
        {label}
      </div>
      <div
        className={
          warn
            ? "font-mono text-2xl text-red-400"
            : "font-mono text-2xl text-foreground"
        }
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-text-muted">{sub}</div>}
    </div>
  );
}

function todayIsoDate(): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  return d.toISOString().slice(0, 10);
}

function isoDateDaysAgo(days: number): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function currentMonthStart(): Date {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
