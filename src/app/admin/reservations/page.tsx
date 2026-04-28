/**
 * /admin/reservations — paginated list with filters.
 * Default view: upcoming (today + future), confirmed/pending only.
 * Filters: ?status=all|confirmed|pending|cancelled|past
 */
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/auth/admin";
import { adminClient } from "@/lib/db/clients";
import { formatPHP } from "@/lib/domain/reservation";
import type { Reservation } from "@/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "today", label: "Today" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdminOrRedirect();
  const sp = await searchParams;
  const filter = (FILTERS.find((f) => f.key === sp.filter)?.key ??
    "upcoming") as FilterKey;

  const sb = adminClient();
  const today = todayIsoDate();

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

  const { data: rows } = await q.returns<Reservation[]>();

  return (
    <div className="px-8 py-8 sm:px-12 sm:py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-noto-serif)] text-2xl tracking-[0.04em] text-foreground">
          Reservations
        </h1>
        <nav className="flex gap-1 text-xs uppercase tracking-[0.18em]">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/reservations?filter=${f.key}`}
              className={
                f.key === filter
                  ? "border border-gold/60 bg-gold/10 px-3 py-2 text-gold"
                  : "border border-transparent px-3 py-2 text-text-muted hover:text-foreground"
              }
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </div>

      {rows && rows.length > 0 ? (
        <div className="border border-border bg-surface/40">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.16em] text-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">Guest</th>
                <th className="px-4 py-3 text-right">Pax</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/40 last:border-b-0">
                  <td className="px-4 py-3 font-mono text-xs">
                    <div>
                      {new Date(r.service_starts_at).toLocaleString("en-PH", {
                        timeZone: "Asia/Manila",
                        month: "short",
                        day: "2-digit",
                        weekday: "short",
                      })}
                    </div>
                    <div className="text-text-muted">
                      {new Date(r.service_starts_at).toLocaleTimeString("en-PH", {
                        timeZone: "Asia/Manila",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{r.guest_name}</div>
                    <div className="text-[11px] text-text-muted">
                      {r.guest_phone} · {r.guest_email}
                    </div>
                    {r.notes && (
                      <div className="mt-1 max-w-md text-[11px] text-gold/70 line-clamp-2">
                        Note: {r.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{r.party_size}</td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {formatPHP(r.total_centavos)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/reservations/${r.id}`}
                      className="text-[11px] uppercase tracking-[0.18em] text-gold/70 hover:text-gold"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="border border-border bg-surface/30 px-4 py-6 text-sm text-text-muted">
          No reservations.
        </p>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Reservation["status"] }) {
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
  const labels: Record<Reservation["status"], string> = {
    pending_payment: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    no_show: "No-show",
    cancelled_full: "Cancelled (100%)",
    cancelled_partial: "Cancelled (50%)",
    cancelled_late: "Cancelled (0%)",
    expired: "Expired",
  };
  return (
    <span
      className={`inline-block border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function todayIsoDate(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return d.toISOString().slice(0, 10);
}
