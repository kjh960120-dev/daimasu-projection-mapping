/**
 * /admin/reservations/[id] — single-reservation detail + actions.
 *
 * Owner can:
 *  - Mark as settled (closes the reservation, records payment method + amount)
 *  - Mark as no-show
 *  - View payment ledger (deposit + refunds)
 *  - View audit log
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/auth/admin";
import { adminClient } from "@/lib/db/clients";
import { formatPHP } from "@/lib/domain/reservation";
import type { Payment, Reservation } from "@/lib/db/types";
import { SettleForm } from "./settle-form";
import { NoShowButton } from "./no-show-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AuditRow {
  id: number;
  occurred_at: string;
  actor: string;
  action: string;
  reason: string | null;
}

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminOrRedirect();
  const { id } = await params;
  const sb = adminClient();

  const [{ data: reservation }, { data: payments }, { data: audits }] =
    await Promise.all([
      sb.from("reservations").select("*").eq("id", id).maybeSingle<Reservation>(),
      sb
        .from("payments")
        .select("*")
        .eq("reservation_id", id)
        .order("created_at", { ascending: true })
        .returns<Payment[]>(),
      sb
        .from("audit_log")
        .select("*")
        .eq("reservation_id", id)
        .order("occurred_at", { ascending: false })
        .limit(50)
        .returns<AuditRow[]>(),
    ]);

  if (!reservation) notFound();

  const totalReceived =
    payments?.reduce((sum, p) => sum + p.amount_centavos, 0) ?? 0;

  return (
    <div className="px-8 py-8 sm:px-12 sm:py-12">
      <Link
        href="/admin/reservations"
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Reservations
      </Link>

      <h1 className="mb-2 font-[family-name:var(--font-noto-serif)] text-2xl tracking-[0.04em] text-foreground">
        {reservation.guest_name}
      </h1>
      <p className="mb-8 text-sm text-text-muted">
        {new Date(reservation.service_starts_at).toLocaleString("en-PH", {
          timeZone: "Asia/Manila",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {" · "}
        {reservation.party_size} pax
      </p>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Left: Detail card */}
        <div className="border border-border bg-surface/40 p-6">
          <h2 className="mb-4 text-xs uppercase tracking-[0.18em] text-gold/70">
            Reservation
          </h2>
          <DataRow label="Status" value={reservation.status} />
          <DataRow label="Phone" value={reservation.guest_phone} />
          <DataRow label="Email" value={reservation.guest_email} />
          <DataRow label="Lang" value={reservation.guest_lang.toUpperCase()} />
          <DataRow label="Source" value={reservation.source} />
          <DataRow
            label="Course total"
            value={formatPHP(reservation.total_centavos)}
          />
          <DataRow
            label="Deposit (paid)"
            value={formatPHP(reservation.deposit_centavos)}
          />
          <DataRow
            label="Balance (on-site)"
            value={formatPHP(reservation.balance_centavos)}
          />
          {reservation.notes && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground">
                {reservation.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="border border-border bg-surface/40 p-6">
          <h2 className="mb-4 text-xs uppercase tracking-[0.18em] text-gold/70">
            Actions
          </h2>
          {reservation.status === "confirmed" ? (
            <>
              <SettleForm reservation={reservation} />
              <div className="mt-6 border-t border-border pt-6">
                <NoShowButton reservation={reservation} />
              </div>
            </>
          ) : reservation.status === "completed" ? (
            <p className="text-sm text-green-400">
              Settled on{" "}
              {reservation.settled_at &&
                new Date(reservation.settled_at).toLocaleString("en-PH", {
                  timeZone: "Asia/Manila",
                })}
              {" · "}
              {reservation.settlement_method ?? "—"}
              {" · "}
              {formatPHP(reservation.settlement_centavos ?? 0)}
            </p>
          ) : reservation.status === "no_show" ? (
            <p className="text-sm text-red-400">
              Marked as no-show. Deposit retained.
            </p>
          ) : reservation.status === "pending_payment" ? (
            <p className="text-sm text-yellow-400">
              Awaiting Stripe Checkout completion. Released automatically after 30 min.
            </p>
          ) : (
            <p className="text-sm text-text-muted">
              Cancelled. No further action.
            </p>
          )}
        </div>
      </section>

      {/* Payments */}
      <section className="mt-8 border border-border bg-surface/40">
        <header className="border-b border-border px-6 py-4 text-xs uppercase tracking-[0.18em] text-gold/70">
          Payment ledger · Net received {formatPHP(totalReceived)}
        </header>
        {payments && payments.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.16em] text-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">Kind</th>
                <th className="px-4 py-3 text-left">Provider</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border/40 last:border-b-0">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">
                    {new Date(p.created_at).toLocaleString("en-PH", {
                      timeZone: "Asia/Manila",
                    })}
                  </td>
                  <td className="px-4 py-3">{p.kind}</td>
                  <td className="px-4 py-3 text-text-muted">{p.provider}</td>
                  <td className="px-4 py-3 text-text-muted">{p.method ?? "—"}</td>
                  <td
                    className={
                      p.amount_centavos < 0
                        ? "px-4 py-3 text-right text-red-400"
                        : "px-4 py-3 text-right text-foreground"
                    }
                  >
                    {formatPHP(p.amount_centavos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-6 text-sm text-text-muted">No payments recorded.</p>
        )}
      </section>

      {/* Audit log */}
      <section className="mt-8 border border-border bg-surface/40">
        <header className="border-b border-border px-6 py-4 text-xs uppercase tracking-[0.18em] text-gold/70">
          Audit log
        </header>
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-[0.16em] text-text-muted">
            <tr>
              <th className="px-4 py-3 text-left">When</th>
              <th className="px-4 py-3 text-left">Actor</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Reason</th>
            </tr>
          </thead>
          <tbody>
            {(audits ?? []).map((a) => (
              <tr key={a.id} className="border-b border-border/40 last:border-b-0">
                <td className="px-4 py-3 font-mono text-xs text-text-muted">
                  {new Date(a.occurred_at).toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                  })}
                </td>
                <td className="px-4 py-3 text-text-muted">{a.actor}</td>
                <td className="px-4 py-3">{a.action}</td>
                <td className="px-4 py-3 text-text-muted">{a.reason ?? "—"}</td>
              </tr>
            ))}
            {(audits ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-text-muted">
                  No audit events.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 py-2 text-sm last:border-b-0">
      <span className="text-text-muted">{label}</span>
      <span className="text-foreground font-[family-name:var(--font-noto-serif)]">{value}</span>
    </div>
  );
}
