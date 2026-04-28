"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { RestaurantSettings, SeatingSlot } from "@/lib/db/types";
import { formatPHP } from "@/lib/domain/reservation";
import type { AdminLang } from "@/lib/auth/admin-lang";

interface DayCell {
  date: string;
  s1_taken: number;
  s2_taken: number;
  closed: boolean;
}

export function ManualBookingForm({
  lang,
  settings,
  grid,
  defaultDate,
  defaultSeating,
}: {
  lang: AdminLang;
  settings: RestaurantSettings;
  grid: DayCell[];
  defaultDate?: string;
  defaultSeating?: SeatingSlot;
}) {
  const ti = (ja: string, en: string) => (lang === "ja" ? ja : en);
  const router = useRouter();

  const [date, setDate] = useState(defaultDate ?? grid[0]?.date ?? "");
  const [seating, setSeating] = useState<SeatingSlot>(defaultSeating ?? "s1");
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+63 ");
  const [email, setEmail] = useState("");
  const [guestLang, setGuestLang] = useState<"ja" | "en">("en");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<"phone" | "walkin" | "staff">("phone");
  const [depositReceived, setDepositReceived] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cellAvail = useMemo(() => {
    const c = grid.find((g) => g.date === date);
    if (!c) return null;
    return c;
  }, [grid, date]);

  const seatTaken = cellAvail
    ? seating === "s1"
      ? cellAvail.s1_taken
      : cellAvail.s2_taken
    : 0;
  const seatRemaining = Math.max(0, settings.online_seats - seatTaken);
  const dateClosed = cellAvail?.closed ?? false;

  const courseTotal = settings.course_price_centavos * partySize;
  const deposit = Math.floor((courseTotal * settings.deposit_pct) / 100);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_date: date,
          seating,
          party_size: partySize,
          guest_name: name,
          guest_email: email,
          guest_phone: phone,
          guest_lang: guestLang,
          notes: notes.trim() || null,
          source,
          deposit_received: depositReceived,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        reservation_id?: string;
        error?: { code?: string };
      };
      if (!data.ok) {
        setStatus("error");
        setErrorMsg(data.error?.code ?? "failed");
        return;
      }
      setStatus("ok");
      if (data.reservation_id) {
        router.push(`/admin/reservations/${data.reservation_id}`);
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Network");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* LEFT — date & seat picker */}
      <div className="border border-border bg-surface/40 p-4">
        <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-gold/70">
          {ti("空席状況 (14日)", "Capacity (14d)")}
        </p>
        <div className="flex flex-col gap-1">
          {grid.map((g) => (
            <DateRow
              key={g.date}
              cell={g}
              total={settings.online_seats}
              selected={g.date === date}
              currentSeating={seating}
              onPick={(d, s) => {
                setDate(d);
                if (s) setSeating(s);
              }}
              lang={lang}
            />
          ))}
        </div>
      </div>

      {/* RIGHT — form fields */}
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={ti("日付", "Date")}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              required
            />
          </Field>
          <Field label={ti("時間帯", "Seating")}>
            <select
              value={seating}
              onChange={(e) => setSeating(e.target.value as SeatingSlot)}
              className={inputCls}
            >
              <option value="s1">{settings.seating_1_label} (1部)</option>
              <option value="s2">{settings.seating_2_label} (2部)</option>
            </select>
          </Field>
          <Field label={ti("人数", "Party size")}>
            <input
              type="number"
              min={1}
              max={Math.min(8, settings.online_seats)}
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value, 10) || 1)}
              className={inputCls}
              required
            />
            <span className="text-[10px] text-text-muted">
              {ti(
                `この時間帯の残り席: ${seatRemaining}`,
                `Seats remaining this slot: ${seatRemaining}`
              )}
            </span>
          </Field>
          <Field label={ti("経路", "Source")}>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as typeof source)}
              className={inputCls}
            >
              <option value="phone">{ti("電話", "Phone")}</option>
              <option value="walkin">{ti("来店", "Walk-in")}</option>
              <option value="staff">{ti("スタッフ手動", "Staff manual")}</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={ti("お客様名", "Guest name")}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              required
              maxLength={80}
            />
          </Field>
          <Field label={ti("電話番号", "Phone")}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
              required
              maxLength={30}
            />
          </Field>
          <Field label={ti("メール (任意)", "Email (optional)")}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              maxLength={254}
            />
          </Field>
          <Field label={ti("お客様の言語", "Guest language")}>
            <select
              value={guestLang}
              onChange={(e) => setGuestLang(e.target.value as "ja" | "en")}
              className={inputCls}
            >
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </Field>
        </div>

        <Field label={ti("備考 (アレルギー・記念日など)", "Notes (allergies, occasion)")}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={280}
            className={inputCls}
          />
        </Field>

        <div className="border border-border bg-background/40 p-4">
          <div className="grid gap-1 text-[12px]">
            <Row
              label={ti("コース料金", "Course price")}
              value={`${formatPHP(settings.course_price_centavos, lang)} × ${partySize}`}
            />
            <Row
              label={ti("合計", "Total")}
              value={formatPHP(courseTotal, lang)}
            />
            <Row
              label={ti(`デポジット (${settings.deposit_pct}%)`, `Deposit (${settings.deposit_pct}%)`)}
              value={formatPHP(deposit, lang)}
            />
          </div>
          <label className="mt-3 flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={depositReceived}
              onChange={(e) => setDepositReceived(e.target.checked)}
              className="accent-gold"
            />
            <span className="text-foreground">
              {ti(
                "現金でデポジットを既に受領済み (記録に追加)",
                "Cash deposit already received (record it)"
              )}
            </span>
          </label>
        </div>

        {dateClosed && (
          <p className="text-[12px] text-red-400">
            {ti(
              "選択した日は休業日に設定されています。",
              "Selected date is marked as closed."
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "pending" || dateClosed || partySize > seatRemaining}
          className="btn-gold-ornate inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium tracking-[0.14em] disabled:opacity-50"
        >
          {status === "pending" ? (
            <>
              <Loader2 className="animate-spin" size={14} aria-hidden="true" />
              {ti("登録中...", "Saving...")}
            </>
          ) : status === "ok" ? (
            <>
              <CheckCircle2 size={14} aria-hidden="true" />
              {ti("登録完了", "Saved")}
            </>
          ) : (
            ti("予約を登録する", "Save booking")
          )}
        </button>

        {status === "error" && (
          <p className="text-[12px] text-red-400">
            {errorMsg === "capacity_exceeded"
              ? ti(
                  "席が足りません。別の時間帯を選んでください。",
                  "Capacity exceeded. Pick a different slot."
                )
              : errorMsg === "closed_date"
                ? ti("選択した日は休業日です。", "Selected date is closed.")
                : errorMsg ?? ti("登録に失敗しました。", "Failed to save.")}
          </p>
        )}
      </div>
    </form>
  );
}

const inputCls =
  "border border-border bg-background/50 px-3 py-2 text-[13px] text-foreground focus:border-gold/60 focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/30 py-1 last:border-b-0">
      <span className="text-text-muted">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}

function DateRow({
  cell,
  total,
  selected,
  currentSeating,
  onPick,
  lang,
}: {
  cell: DayCell;
  total: number;
  selected: boolean;
  currentSeating: SeatingSlot;
  onPick: (date: string, seating?: SeatingSlot) => void;
  lang: AdminLang;
}) {
  const ti = (ja: string, en: string) => (lang === "ja" ? ja : en);
  const dt = new Date(`${cell.date}T00:00:00+08:00`);
  const dow = dt.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
  });
  const monthDay = dt.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "2-digit",
  });
  const s1Full = cell.s1_taken >= total;
  const s2Full = cell.s2_taken >= total;
  return (
    <button
      type="button"
      onClick={() => onPick(cell.date, currentSeating)}
      disabled={cell.closed}
      className={
        selected
          ? "grid grid-cols-[60px_1fr_1fr] items-center gap-2 border border-gold/60 bg-gold/10 px-2 py-1.5 text-left text-[11px]"
          : cell.closed
            ? "grid grid-cols-[60px_1fr_1fr] items-center gap-2 border border-border/30 bg-background/20 px-2 py-1.5 text-left text-[11px] text-text-muted/60"
            : "grid grid-cols-[60px_1fr_1fr] items-center gap-2 border border-border/40 bg-background/30 px-2 py-1.5 text-left text-[11px] hover:border-gold/40 hover:bg-surface/60"
      }
    >
      <span className="font-mono">
        <span className="block">{monthDay}</span>
        <span className="block text-[9px] text-text-muted">{dow}</span>
      </span>
      <SlotBadge
        slot="s1"
        taken={cell.s1_taken}
        total={total}
        full={s1Full}
        closed={cell.closed}
        active={selected && currentSeating === "s1"}
        onClick={(e) => {
          e.stopPropagation();
          if (!cell.closed) onPick(cell.date, "s1");
        }}
        label={ti("1部", "S1")}
      />
      <SlotBadge
        slot="s2"
        taken={cell.s2_taken}
        total={total}
        full={s2Full}
        closed={cell.closed}
        active={selected && currentSeating === "s2"}
        onClick={(e) => {
          e.stopPropagation();
          if (!cell.closed) onPick(cell.date, "s2");
        }}
        label={ti("2部", "S2")}
      />
    </button>
  );
}

function SlotBadge({
  taken,
  total,
  full,
  closed,
  active,
  onClick,
  label,
}: {
  slot: SeatingSlot;
  taken: number;
  total: number;
  full: boolean;
  closed: boolean;
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  label: string;
}) {
  return (
    <span
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center justify-between border border-gold bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold"
          : full || closed
            ? "inline-flex items-center justify-between border border-red-500/40 bg-red-500/5 px-1.5 py-0.5 text-[10px] text-red-400/80"
            : "inline-flex items-center justify-between border border-border/40 px-1.5 py-0.5 text-[10px] text-foreground"
      }
    >
      <span className="font-mono">{label}</span>
      <span className="font-mono">
        {taken}/{total}
      </span>
    </span>
  );
}
