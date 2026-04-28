"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { Reservation } from "@/lib/db/types";

export function NoShowButton({ reservation }: { reservation: Reservation }) {
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function execute() {
    setStatus("pending");
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/admin/reservations/${reservation.id}/mark-no-show`,
        { method: "POST" }
      );
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed");
        return;
      }
      window.location.reload();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Network");
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 border border-red-500/40 px-4 py-2 text-xs uppercase tracking-[0.14em] text-red-400 hover:bg-red-500/10"
      >
        <AlertTriangle size={14} aria-hidden="true" />
        Mark as no-show
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-red-400">
        Confirm: deposit will be retained, balance forfeited.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={execute}
          disabled={status === "pending"}
          className="inline-flex items-center gap-2 border border-red-500/60 bg-red-500/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-red-400 hover:bg-red-500/20 disabled:opacity-60"
        >
          {status === "pending" ? (
            <>
              <Loader2 className="animate-spin" size={14} aria-hidden="true" />
              Processing...
            </>
          ) : (
            "Yes, no-show"
          )}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs uppercase tracking-[0.14em] text-text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      {status === "error" && <p className="text-xs text-red-400">{errorMsg}</p>}
    </div>
  );
}
