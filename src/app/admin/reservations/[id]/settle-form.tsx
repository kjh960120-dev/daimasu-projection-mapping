"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Reservation, PaymentMethod } from "@/lib/db/types";
import { formatPHP } from "@/lib/domain/reservation";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "gcash", label: "GCash" },
  { value: "deposit_only", label: "Deposit only (no balance)" },
];

export function SettleForm({ reservation }: { reservation: Reservation }) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amountPesos, setAmountPesos] = useState(
    String(reservation.balance_centavos / 100)
  );
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          amount_centavos: Math.round(parseFloat(amountPesos || "0") * 100),
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed");
        return;
      }
      setStatus("ok");
      window.location.reload();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Network");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gold/70">
        Mark as settled
      </p>
      <p className="text-sm text-text-secondary">
        Balance owed: {formatPHP(reservation.balance_centavos)}
      </p>

      <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.14em] text-text-muted">
        Payment method
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          className="border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-gold/60 focus:outline-none"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-xs uppercase tracking-[0.14em] text-text-muted">
        Total received (₱)
        <input
          type="number"
          min="0"
          step="0.01"
          required
          value={amountPesos}
          onChange={(e) => setAmountPesos(e.target.value)}
          className="border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-gold/60 focus:outline-none"
        />
        <span className="text-[10px] text-text-muted">
          Drinks / upsell beyond the course can be added here.
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "pending"}
        className="btn-gold-ornate inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium tracking-[0.14em] disabled:opacity-60"
      >
        {status === "pending" ? (
          <>
            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
            Saving...
          </>
        ) : status === "ok" ? (
          <>
            <CheckCircle2 size={14} aria-hidden="true" />
            Settled
          </>
        ) : (
          "Mark as settled"
        )}
      </button>

      {status === "error" && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
    </form>
  );
}
