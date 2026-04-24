"use client";

import { useState, useMemo } from "react";
import { MessageCircle, ArrowUpRight, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useLang } from "@/lib/language";
import { CONTACT, COURSE_PRICE } from "@/lib/constants";

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || "";

const SEATINGS = [
  { value: "17:30", label: { ja: "1部 17:30", en: "Seating 1 · 17:30" } },
  { value: "19:30", label: { ja: "2部 19:30", en: "Seating 2 · 19:30" } },
];

type Status = "idle" | "sending" | "success" | "error";

const ViberIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M11.4 0C9.473.028 5.333.344 3.02 2.436 1.302 4.121.696 6.614.63 9.702.569 12.79.49 18.575 6.07 20.14h.005l-.004 2.395s-.037.97.602 1.17c.79.246 1.233-.51 1.978-1.324.409-.447.973-1.103 1.4-1.602 3.814.318 6.747-.41 7.08-.517.77-.25 5.124-.809 5.832-6.585.73-5.954-.353-9.72-2.303-11.418l-.01-.008c-.59-.54-2.952-2.26-8.22-2.28 0 0-.392-.024-1.025-.025Zm.064 1.652c.536 0 .869.021.869.021 4.456.014 6.372 1.352 6.872 1.806 1.649 1.417 2.49 4.81 1.875 9.785-.594 4.822-4.124 5.127-4.776 5.337-.278.09-2.857.726-6.098.515 0 0-2.415 2.91-3.169 3.667-.118.12-.256.164-.348.142-.13-.033-.166-.187-.165-.412.002-.321.02-3.978.02-3.978-.003 0-.003 0 0 0-4.72-1.31-4.445-6.233-4.392-8.811.053-2.577.543-4.69 1.996-6.126 1.957-1.743 5.47-2.002 7.108-2.016.008 0 .112-.01.208-.01Z" />
  </svg>
);

function formatHumanDate(d: Date | undefined, lang: "ja" | "en"): string {
  if (!d) return "";
  if (lang === "ja") {
    const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${w})`;
  }
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatManilaNow(): string {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " MNL";
}

// HTML-escape to avoid breaking Telegram HTML parse mode
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildTelegramMessage(payload: {
  name: string;
  phone: string;
  date: Date;
  seating: string;
  party: string;
  notes: string;
}): string {
  const dateFmt = formatHumanDate(payload.date, "en");
  return [
    "<b>DAIMASU 예약 요청 / New Reservation</b>",
    "━━━━━━━━━━━━━━━━━━━━━",
    `<b>이름</b>: ${escapeHtml(payload.name)}`,
    `<b>전화</b>: ${escapeHtml(payload.phone)}`,
    `<b>날짜</b>: ${escapeHtml(dateFmt)}`,
    `<b>시간</b>: ${escapeHtml(payload.seating)}`,
    `<b>인원</b>: ${escapeHtml(payload.party)}명`,
    `<b>비고</b>: ${escapeHtml(payload.notes || "없음")}`,
    "━━━━━━━━━━━━━━━━━━━━━",
    `제출: ${formatManilaNow()}`,
    "via daimasu.com.ph",
  ].join("\n");
}

async function sendToTelegram(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Telegram credentials missing");
    return false;
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    const data = await res.json();
    return !!data.ok;
  } catch (err) {
    console.error("Telegram send failed:", err);
    return false;
  }
}

export default function ReservationForm() {
  const { t, lang } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [seating, setSeating] = useState<string>(SEATINGS[0].value);
  const [party, setParty] = useState("2");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  }, []);

  const reset = () => {
    setName("");
    setPhone("");
    setSelectedDate(undefined);
    setSeating(SEATINGS[0].value);
    setParty("2");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending" || !selectedDate) return;
    setStatus("sending");
    const msg = buildTelegramMessage({ name, phone, date: selectedDate, seating, party, notes });
    const ok = await sendToTelegram(msg);
    if (ok) {
      setStatus("success");
      reset();
      setTimeout(() => setStatus("idle"), 8000);
    } else {
      setStatus("error");
    }
  };

  const labelClass = "text-xs font-medium tracking-[0.15em] text-gold/90 uppercase";
  const inputClass =
    "w-full border border-border bg-background/50 px-3 py-2.5 text-base sm:text-sm text-foreground placeholder:text-text-muted/70 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors";

  return (
    <div className="flex flex-col gap-6 border border-border bg-surface/50 p-8">
      <div>
        <p className="mb-2 text-xs tracking-[0.3em] text-gold/70">
          {t("ご予約", "RESERVATIONS")}
        </p>
        <h3 className="mb-3 font-[family-name:var(--font-display)] text-2xl font-light tracking-wide text-foreground">
          {t(
            <>フォームから<span className="text-gold">ご予約</span></>,
            <>Book by <span className="text-gold">filling the form</span></>
          )}
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {t(
            "下記ご記入の上『予約を送信』を押すと、スタッフに直接通知されます。24時間以内にご返答いたします。",
            "Fill in the details below and press Send — our staff will be notified instantly and reply within 24 hours."
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="res-name" className={labelClass}>
              {t("お名前", "Name")} *
            </label>
            <input
              id="res-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className={inputClass}
              placeholder={lang === "ja" ? "山田 太郎" : "Juan dela Cruz"}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="res-phone" className={labelClass}>
              {t("電話番号", "Phone")} *
            </label>
            <input
              id="res-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              inputMode="tel"
              className={inputClass}
              placeholder="+63 917 XXX XXXX"
              pattern="[+0-9 ()-]{7,20}"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="res-seating" className={labelClass}>
              {t("ご希望時間", "Seating")} *
            </label>
            <select
              id="res-seating"
              value={seating}
              onChange={(e) => setSeating(e.target.value)}
              required
              className={inputClass}
            >
              {SEATINGS.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.label.ja, s.label.en)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="res-party" className={labelClass}>
              {t("人数", "Party size")} *
            </label>
            <select
              id="res-party"
              value={party}
              onChange={(e) => setParty(e.target.value)}
              required
              className={inputClass}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={String(n)}>
                  {n} {lang === "ja" ? "名" : n === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            {t("ご希望日", "Preferred date")} *
          </label>
          <div
            className="rdp-daimasu flex justify-center border border-border bg-background/40 p-3"
            aria-live="polite"
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={{ before: minDate, after: maxDate }}
              weekStartsOn={1}
              numberOfMonths={1}
              showOutsideDays
              required
            />
          </div>
          <p className="text-[11px] tracking-wide text-text-muted">
            {selectedDate ? (
              <span className="text-gold/80">
                {t("選択済: ", "Selected: ")}
                {formatHumanDate(selectedDate, lang)}
              </span>
            ) : (
              t(
                "※ 本日〜3ヶ月先までお選びいただけます",
                "Pick any date from today up to 3 months ahead."
              )
            )}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="res-notes" className={labelClass}>
            {t("備考 (任意)", "Notes (optional)")}
          </label>
          <textarea
            id="res-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder={
              lang === "ja"
                ? "アレルギー・記念日・車椅子利用など"
                : "Allergies, anniversary, wheelchair access, etc."
            }
          />
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <button
            type="submit"
            disabled={status === "sending" || status === "success" || !selectedDate}
            className="inline-flex items-center justify-center gap-2 bg-gold px-8 py-4 text-sm tracking-[0.2em] text-background transition-all duration-300 hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "sending" ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                {t("送信中...", "Sending...")}
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 size={16} aria-hidden="true" />
                {t("送信完了", "Sent successfully")}
              </>
            ) : (
              <>
                <Send size={16} aria-hidden="true" />
                {t("予約を送信", "Send Reservation")}
              </>
            )}
          </button>

          {status === "success" && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-3 border border-gold/60 bg-gold/10 p-4 text-sm text-gold"
            >
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="mb-1 font-medium">
                  {t("予約リクエストを受け付けました", "Reservation request received")}
                </p>
                <p className="text-xs leading-relaxed text-gold/80">
                  {t(
                    "スタッフに通知されました。24時間以内にご記入のお電話またはWhatsAppでご連絡いたします。",
                    "Our staff has been notified. You will be contacted within 24 hours via phone or WhatsApp."
                  )}
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div
              role="alert"
              className="flex items-start gap-3 border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-400"
            >
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="mb-1 font-medium">
                  {t("送信に失敗しました", "Submission failed")}
                </p>
                <p className="text-xs leading-relaxed">
                  {t(
                    "ネットワーク状況をご確認の上、もう一度お試しいただくか、下記WhatsAppまたはお電話で直接ご連絡ください。",
                    "Please check your connection and try again, or contact us directly via WhatsApp or phone below."
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Backup: direct messaging */}
      <div className="flex flex-col gap-3 border-t border-border/60 pt-5">
        <p className="text-xs tracking-[0.2em] text-gold/70">
          {t("または直接メッセージ", "OR MESSAGE US DIRECTLY")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={CONTACT.whatsapp.reservationHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 border border-gold/60 bg-gold/5 px-6 py-3 text-xs tracking-[0.2em] text-gold transition-all duration-300 hover:bg-gold/15"
          >
            <MessageCircle size={16} aria-hidden="true" />
            WhatsApp
            <ArrowUpRight size={12} aria-hidden="true" />
          </a>
          <a
            href={CONTACT.viber.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 border border-gold/60 bg-gold/5 px-6 py-3 text-xs tracking-[0.2em] text-gold transition-all duration-300 hover:bg-gold/15"
          >
            <ViberIcon size={16} />
            Viber
            <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed tracking-wide text-text-muted">
        {t(
          `※ コース料金 ${COURSE_PRICE.amount}(お一人様・税サ別)・お支払いは現地払い(現金 / カード / GCash)。キャンセルは24時間前までご連絡ください。`,
          `Course ${COURSE_PRICE.amount} per guest (tax & service not included). Payment on-site (cash / card / GCash). Please cancel at least 24 hours in advance.`
        )}
      </p>
    </div>
  );
}
