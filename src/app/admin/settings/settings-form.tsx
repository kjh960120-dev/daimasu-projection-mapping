"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { RestaurantSettings } from "@/lib/db/types";

export function SettingsForm({ settings }: { settings: RestaurantSettings }) {
  const [s, setS] = useState(settings);
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function update<K extends keyof RestaurantSettings>(
    key: K,
    val: RestaurantSettings[K]
  ) {
    setS((prev) => ({ ...prev, [key]: val }));
    setStatus("idle");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed");
        return;
      }
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Network");
    }
  }

  return (
    <form onSubmit={save} className="grid gap-8 lg:grid-cols-2">
      <Section title="Reservations">
        <Toggle
          label="Reservations open (public form)"
          checked={s.reservations_open}
          onChange={(v) => update("reservations_open", v)}
        />
        <NumberField
          label="Total seats"
          value={s.total_seats}
          onChange={(v) => update("total_seats", v)}
          min={1}
          max={20}
        />
        <NumberField
          label="Online-bookable seats"
          value={s.online_seats}
          onChange={(v) => update("online_seats", v)}
          min={0}
          max={s.total_seats}
          help="Walk-in budget = total − online."
        />
        <NumberField
          label="Service minutes"
          value={s.service_minutes}
          onChange={(v) => update("service_minutes", v)}
          min={30}
          max={300}
        />
      </Section>

      <Section title="Pricing & deposit">
        <NumberField
          label="Course price (₱)"
          value={Math.floor(s.course_price_centavos / 100)}
          onChange={(v) => update("course_price_centavos", v * 100)}
          min={0}
        />
        <NumberField
          label="Deposit %"
          value={s.deposit_pct}
          onChange={(v) => update("deposit_pct", v)}
          min={0}
          max={100}
        />
        <NumberField
          label="Monthly revenue target (₱)"
          value={Math.floor(s.monthly_revenue_target_centavos / 100)}
          onChange={(v) =>
            update("monthly_revenue_target_centavos", v * 100)
          }
          min={0}
        />
      </Section>

      <Section title="Cancellation policy">
        <NumberField
          label="100% refund cutoff (hours)"
          value={s.refund_full_hours}
          onChange={(v) => update("refund_full_hours", v)}
          min={0}
          max={168}
        />
        <NumberField
          label="50% refund cutoff (hours)"
          value={s.refund_partial_hours}
          onChange={(v) => update("refund_partial_hours", v)}
          min={0}
          max={s.refund_full_hours}
          help="Below this: 0% refund."
        />
      </Section>

      <Section title="Reminders">
        <NumberField
          label="Long reminder (hours before)"
          value={s.reminder_long_hours}
          onChange={(v) => update("reminder_long_hours", v)}
          min={1}
          max={72}
        />
        <NumberField
          label="Short reminder (hours before)"
          value={s.reminder_short_hours}
          onChange={(v) => update("reminder_short_hours", v)}
          min={0}
          max={s.reminder_long_hours - 1}
        />
      </Section>

      <Section title="Notification channels">
        <TextField
          label="Telegram bot token"
          value={s.telegram_bot_token ?? ""}
          onChange={(v) => update("telegram_bot_token", v || null)}
          help="From @BotFather. Leave blank to disable Telegram alerts."
        />
        <TextField
          label="Telegram chat ID"
          value={s.telegram_chat_id ?? ""}
          onChange={(v) => update("telegram_chat_id", v || null)}
        />
        <TextField
          label="WhatsApp 'from' number (Twilio)"
          value={s.whatsapp_from_number ?? ""}
          onChange={(v) => update("whatsapp_from_number", v || null)}
          help="e.g. whatsapp:+14155238886"
        />
        <TextField
          label="Resend 'from' email"
          value={s.resend_from_email ?? ""}
          onChange={(v) => update("resend_from_email", v || null)}
        />
      </Section>

      <Section title="Display">
        <TextField
          label="Display name"
          value={s.display_name}
          onChange={(v) => update("display_name", v)}
        />
        <TextField
          label="Timezone (IANA)"
          value={s.timezone}
          onChange={(v) => update("timezone", v)}
          help="Default: Asia/Manila"
        />
      </Section>

      <div className="lg:col-span-2 flex items-center gap-4 border-t border-border pt-6">
        <button
          type="submit"
          disabled={status === "pending"}
          className="btn-gold-ornate inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium tracking-[0.14em] disabled:opacity-60"
        >
          {status === "pending" ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Saving...
            </>
          ) : status === "ok" ? (
            <>
              <CheckCircle2 size={16} />
              Saved
            </>
          ) : (
            "Save settings"
          )}
        </button>
        {status === "error" && <p className="text-xs text-red-400">{errorMsg}</p>}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-border bg-surface/40 p-6">
      <legend className="px-2 text-xs uppercase tracking-[0.18em] text-gold/70">
        {title}
      </legend>
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  help,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  help?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.14em] text-text-muted">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-gold/60 focus:outline-none"
      />
      {help && <span className="text-[10px] text-text-muted">{help}</span>}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  help?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.14em] text-text-muted">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-gold/60 focus:outline-none"
      />
      {help && <span className="text-[10px] text-text-muted">{help}</span>}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 border border-border/40 bg-background/30 px-3 py-2.5">
      <span className="text-sm text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-gold"
      />
    </label>
  );
}
